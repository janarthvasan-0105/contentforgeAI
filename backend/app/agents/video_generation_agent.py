"""
video_generation_agent.py
─────────────────────────
Calls Google Veo 3.x with the prompt built by video_prompt_agent.
Single Veo call → single 8-second clip.

Implements:
  - Fix 1 (context-bleeding doc): MultiSceneRejected guard — reject any prompt
    that contains multiple FRAME tokens before hitting the API.
  - Logo overlay via apply_logo_to_video if logo_url is in state.
  - Diagnostic logging per debug-generic-dialogue.md:
      • Log dialogue_line before the Veo call to confirm ScriptAgent wired it.
      • Log the FULL final video_prompt right before submission to confirm the
        dialogue clause isn't being silently stripped.

Pipeline:
  1. Read state["video_prompt"] — final Veo prompt string.
  2. Guard against multi-scene prompt leaking into this call.
  3. Submit job → poll until done → download video bytes.
  4. Save to outputs/videos/{session_id}.mp4
  5. Apply logo watermark if requested.
  6. Write state["generated_video"] + state["video_generation_success"].
"""

from __future__ import annotations

import asyncio
import os
import re
import time
import uuid

from pathlib import Path

from app.services.brand_overlay import apply_logo_to_video
from app.agents.video_stitch_transitions import stitch_scenes
from app.services.storage_service import upload_media_to_supabase
from google import genai
from google.genai import types as gtypes

from app.config import get_settings
from app.models.state import ContentForgeState

settings = get_settings()

VEO_MODEL            = os.getenv("VEO_MODEL",            "veo-3.1-lite-generate-preview")
VEO_RESOLUTION       = os.getenv("VEO_RESOLUTION",       "720p")
VEO_POLL_INTERVAL    = int(os.getenv("VEO_POLL_INTERVAL",    "15"))
VEO_MAX_POLL_ATTEMPTS = int(os.getenv("VEO_MAX_POLL_ATTEMPTS", "40"))
OUTPUT_DIR           = "outputs/videos"


# ── Fix 1: Multi-scene guard ──────────────────────────────────────────────────

class MultiSceneRejected(Exception):
    """Raised when a prompt containing multiple FRAME tokens reaches Veo."""


FRAME_TOKEN_PATTERN = re.compile(r"\bFRAME\s*\d", re.IGNORECASE)


def _check_for_multi_scene(prompt: str, scene_id: str = "video") -> None:
    """
    Raise MultiSceneRejected if the prompt contains FRAME-N tokens.
    This is a defense-in-depth guard — the real fix is video_prompt_agent
    never producing a multi-scene prompt in the first place.
    (Fix 1 from veo3-multiscene-context-bleeding-fix.md)
    """
    if FRAME_TOKEN_PATTERN.search(prompt):
        raise MultiSceneRejected(
            f"{scene_id}: prompt contains multiple FRAME tokens — "
            "split into separate calls before sending to Veo"
        )


# ── Platform config ───────────────────────────────────────────────────────────

def _get_veo_config(platform: str) -> dict:
    configs = {
        "instagram": {"aspect_ratio": "9:16",  "resolution": VEO_RESOLUTION},
        "youtube":   {"aspect_ratio": "16:9", "resolution": VEO_RESOLUTION},
        "linkedin":  {"aspect_ratio": "16:9", "resolution": VEO_RESOLUTION},
        "twitter":   {"aspect_ratio": "16:9", "resolution": VEO_RESOLUTION},
    }
    return configs.get(platform.lower(), configs["instagram"])


# ── Veo API call (sync, runs in executor) ────────────────────────────────────

def _generate_video_sync(
    prompt: str,
    aspect_ratio: str,
    output_path: str,
    api_key: str,
    product_image_url: str = None,
) -> dict:
    """
    Submits one Veo job → polls until complete → downloads video bytes.

    When product_image_url is provided, calls Veo in image-to-video mode
    with the uploaded product image as the anchor/reference frame.
    (Part 3, veo-text-cast-product.md)
    """
    # Fix 1: guard before touching the API
    _check_for_multi_scene(prompt)

    client = genai.Client(api_key=api_key)

    mode = "image-to-video" if product_image_url else "text-to-video"
    print(f"[VideoGen] Submitting job to {VEO_MODEL} [{mode}]")
    print(f"[VideoGen] Aspect ratio: {aspect_ratio} | Resolution: {VEO_RESOLUTION}")

    # ── Diagnostic log 2 (debug-generic-dialogue.md §2) ──────────────────────
    # Log the FULL prompt immediately before the Veo call so we can confirm
    # the Dialogue: "..." clause is present and wasn't stripped upstream.
    print(f"[VideoGen] FULL prompt sent to Veo ({len(prompt)} chars):\n{prompt}")

    try:
        veo_kwargs: dict = {
            "model": VEO_MODEL,
            "prompt": prompt,
            "config": gtypes.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                number_of_videos=1,
            ),
        }

        # Part 3 (veo-text-cast-product.md): image-to-video mode
        if product_image_url:
            print(f"[VideoGen] Image-to-video mode — anchor: {product_image_url}")
            veo_kwargs["image"] = gtypes.Image(image_source_url=product_image_url)

        operation = client.models.generate_videos(**veo_kwargs)
    except Exception as e:
        return {"status": "failed", "reason": f"Veo job submission failed: {str(e)}"}

    print(f"[VideoGen] Job submitted. Polling every {VEO_POLL_INTERVAL}s...")

    attempts = 0
    while not operation.done:
        if attempts >= VEO_MAX_POLL_ATTEMPTS:
            return {
                "status": "failed",
                "reason": f"Veo timed out after {VEO_MAX_POLL_ATTEMPTS * VEO_POLL_INTERVAL}s",
            }
        attempts += 1
        elapsed = attempts * VEO_POLL_INTERVAL
        print(f"[VideoGen] Waiting... attempt {attempts}/{VEO_MAX_POLL_ATTEMPTS} ({elapsed}s elapsed)")
        time.sleep(VEO_POLL_INTERVAL)
        try:
            operation = client.operations.get(operation=operation)
        except Exception as e:
            print(f"[VideoGen] Poll error (will retry): {e}")
            continue

    print(f"[VideoGen] Generation complete after {attempts * VEO_POLL_INTERVAL}s")

    # Debug output
    print(f"[VideoGen] DEBUG — operation.error: {getattr(operation, 'error', None)}")
    if hasattr(operation, "response"):
        print(f"[VideoGen] DEBUG — response type: {type(operation.response)}")
    else:
        print("[VideoGen] DEBUG — operation has no 'response' attribute!")

    try:
        if getattr(operation, "error", None):
            return {"status": "failed", "reason": f"API returned error: {operation.error}"}

        response = getattr(operation, "response", None)
        if not response:
            return {"status": "failed", "reason": "Veo returned no response object"}

        generated_videos = getattr(response, "generated_videos", None)
        if not generated_videos and isinstance(response, dict):
            generated_videos = response.get("generated_videos") or response.get("generatedVideos")

        if not generated_videos:
            return {"status": "failed", "reason": f"Veo returned no generated videos. Raw response: {response}"}

        video = (
            generated_videos[0].video
            if hasattr(generated_videos[0], "video")
            else generated_videos[0].get("video")
        )
    except Exception as e:
        return {"status": "failed", "reason": f"Failed to extract video from response: {str(e)}"}

    try:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        client.files.download(file=video)
        video_bytes = video.video_bytes

        if not video_bytes:
            return {"status": "failed", "reason": "Video bytes are empty after download"}

        with open(output_path, "wb") as f:
            f.write(video_bytes)

        file_size_mb = len(video_bytes) / (1024 * 1024)
        print(f"[VideoGen] Video saved → {output_path} ({file_size_mb:.1f} MB)")

        return {
            "status": "success",
            "local_path": output_path,
            "file_size_mb": round(file_size_mb, 2),
            "aspect_ratio": aspect_ratio,
            "resolution": VEO_RESOLUTION,
            "model": VEO_MODEL,
            "generation_time_seconds": attempts * VEO_POLL_INTERVAL,
        }
    except Exception as e:
        return {"status": "failed", "reason": f"Video download/save failed: {str(e)}"}


# ── Main async agent ──────────────────────────────────────────────────────────

async def video_generation_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates a single 8-second video using Veo 3.x.

    Input:
        state["video_prompt"]  — final Veo prompt (built by video_prompt_agent)
        state["platform"]      — instagram / youtube / linkedin / twitter
        state["session_id"]    — unique session identifier

    Output:
        state["generated_video"]          — dict with local_path, url, metadata
        state["video_generation_success"] — True / False
    """
    session_id         = state.get("session_id", str(uuid.uuid4()))
    platform           = state.get("platform", "instagram").lower()
    video_prompt       = state.get("video_prompt", "").strip()
    product_image_url  = state.get("product_image_url")  # Part 3, veo-text-cast-product.md

    if not video_prompt:
        print("[VideoGen] No video_prompt in state. Skipping video generation.")
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + ["VideoGen skipped: video_prompt is empty"]
        return state

    # ── Diagnostic log 1 (debug-generic-dialogue.md §1) ──────────────────────
    # Confirm dialogue_line was produced by video_prompt_agent and is present
    # in state before the Veo call. If this prints None/empty, the schema
    # change in video_prompt_agent didn't land correctly.
    scene_data = state.get("video_scene_data", {})
    dialogue_line = scene_data.get("dialogue_line")
    print(f"[VideoGen] DIAG — dialogue_line from video_prompt_agent: {repr(dialogue_line)}")
    if not dialogue_line:
        print("[VideoGen] WARNING — dialogue_line is empty/None. Veo will improvise dialogue.")

    api_key = (
        getattr(settings, "google_api_key", None)
        or getattr(settings, "gemini_api_key", None)
        or os.getenv("GOOGLE_API_KEY", "")
    )
    if not api_key:
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + ["VideoGen failed: GOOGLE_API_KEY not set in .env"]
        return state

    veo_config   = _get_veo_config(platform)
    aspect_ratio = veo_config["aspect_ratio"]
    output_path  = os.path.join(OUTPUT_DIR, f"{session_id}.mp4")

    print(f"[VideoGen] Starting {VEO_MODEL} for platform: {platform}")

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            _generate_video_sync,
            video_prompt,
            aspect_ratio,
            output_path,
            api_key,
            product_image_url,
        )
    except MultiSceneRejected as e:
        print(f"[VideoGen] MultiSceneRejected: {e}")
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + [f"VideoGen rejected: {str(e)}"]
        return state
    except Exception as e:
        print(f"[VideoGen] Executor error: {e}")
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + [f"VideoGen executor error: {str(e)}"]
        return state

    if result["status"] == "success":
        # ── Apply logo overlay if requested ───────────────────────────────────
        logo_url   = state.get("logo_url")
        final_path = result["local_path"]
        if logo_url:
            print("[VideoGen] Applying logo overlay...")
            watermarked = final_path.replace(".mp4", "_watermarked.mp4")
            final_path  = apply_logo_to_video(final_path, logo_url, watermarked)

        # Upload to Supabase Storage
        try:
            public_url = upload_media_to_supabase(final_path)
        except Exception as e:
            print(f"[Storage] Failed to upload video to Supabase: {e}")
            app_base_url = getattr(settings, "app_base_url", "http://localhost:8000")
            public_url = f"{app_base_url}/{final_path.replace(os.sep, '/')}"

        state["generated_video"] = {
            "local_path":               final_path,
            "url":                      public_url,
            "source":                   VEO_MODEL,
            "aspect_ratio":             result["aspect_ratio"],
            "resolution":               result["resolution"],
            "file_size_mb":             result.get("file_size_mb", 0),
            "generation_time_seconds":  result.get("generation_time_seconds", 0),
        }
        state["video_generation_success"] = True
        print(f"[VideoGen] Success — {final_path}")

    else:
        reason = result.get("reason", "Unknown error")
        print(f"[VideoGen] Failed — {reason}")
        state["video_generation_success"] = False
        state["generated_video"]          = {}
        state["errors"] = state.get("errors", []) + [f"VideoGen failed: {reason}"]

    return state
