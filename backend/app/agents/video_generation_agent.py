"""
video_generation_agent.py
Pipeline:
  1. Read cinematic video_prompt from state (written by video_prompt_agent).
  2. Call Veo 3.1 Lite via Gemini API to generate an 8-second video.
  3. Poll operation until complete.
  4. Download video bytes and save to outputs/videos/{session_id}.mp4
  5. Write path + success flag back into state.

Model: veo-3.1-lite-generate-preview
"""

from __future__ import annotations

import asyncio
import os
import time
import uuid

from google import genai
from google.genai import types as gtypes

from app.config import get_settings
from app.models.state import ContentForgeState

settings = get_settings()

VEO_MODEL = os.getenv("VEO_MODEL", "veo-3.1-lite-generate-preview")
VEO_RESOLUTION = os.getenv("VEO_RESOLUTION", "720p")
VEO_POLL_INTERVAL = int(os.getenv("VEO_POLL_INTERVAL", "15"))
VEO_MAX_POLL_ATTEMPTS = int(os.getenv("VEO_MAX_POLL_ATTEMPTS", "40"))
OUTPUT_DIR = "outputs/videos"


def _get_veo_config(platform: str) -> dict:
    configs = {
        "instagram": {"aspect_ratio": "9:16",  "resolution": VEO_RESOLUTION},
        "youtube":   {"aspect_ratio": "16:9", "resolution": VEO_RESOLUTION},
        "linkedin":  {"aspect_ratio": "16:9", "resolution": VEO_RESOLUTION},
        "twitter":   {"aspect_ratio": "16:9", "resolution": VEO_RESOLUTION},
    }
    return configs.get(platform.lower(), configs["instagram"])


def _generate_video_sync(
    prompt: str,
    aspect_ratio: str,
    resolution: str,
    output_path: str,
) -> dict:
    """
    Calls Veo 3.1 Lite synchronously.
    Submits job -> polls until done -> downloads video.
    Runs in executor to avoid blocking FastAPI event loop.
    """
    api_key = (
        getattr(settings, "google_api_key", None) or
        getattr(settings, "gemini_api_key", None) or
        os.getenv("GOOGLE_API_KEY", "")
    )

    if not api_key:
        return {"status": "failed", "reason": "GOOGLE_API_KEY not set in .env"}

    client = genai.Client(api_key=api_key)

    print(f"[VideoGen] Submitting Veo 3.1 Lite job...")
    print(f"[VideoGen] Model: {VEO_MODEL}")
    print(f"[VideoGen] Aspect ratio: {aspect_ratio} | Resolution: {resolution}")
    print(f"[VideoGen] Prompt (first 120 chars): {prompt[:120]}...")

    try:
        operation = client.models.generate_videos(
            model=VEO_MODEL,
            prompt=prompt,
            config=gtypes.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                number_of_videos=1,
            ),
        )
    except Exception as e:
        return {"status": "failed", "reason": f"Veo job submission failed: {str(e)}"}

    print(f"[VideoGen] Job submitted. Polling every {VEO_POLL_INTERVAL}s...")

    attempts = 0
    while not operation.done:
        if attempts >= VEO_MAX_POLL_ATTEMPTS:
            return {
                "status": "failed",
                "reason": f"Veo timed out after {VEO_MAX_POLL_ATTEMPTS * VEO_POLL_INTERVAL}s"
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
    
    # Deep Debugging Output
    print(f"[VideoGen] DEBUG - operation.error: {getattr(operation, 'error', None)}")
    if hasattr(operation, 'response'):
        print(f"[VideoGen] DEBUG - operation.response type: {type(operation.response)}")
        print(f"[VideoGen] DEBUG - operation.response dir: {dir(operation.response)}")
    else:
        print("[VideoGen] DEBUG - operation has no 'response' attribute!")

    try:
        if getattr(operation, 'error', None):
            return {"status": "failed", "reason": f"API returned error: {operation.error}"}
            
        response = getattr(operation, 'response', None)
        if not response:
            return {"status": "failed", "reason": "Veo returned no response object"}
            
        generated_videos = getattr(response, 'generated_videos', None)
        
        if not generated_videos:
            # Fallback check just in case it's a dict
            if isinstance(response, dict):
                generated_videos = response.get('generated_videos') or response.get('generatedVideos')
                
        if not generated_videos:
            return {"status": "failed", "reason": f"Veo returned no generated videos. Raw response: {response}"}
            
        video = generated_videos[0].video if hasattr(generated_videos[0], 'video') else generated_videos[0].get('video')
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
        print(f"[VideoGen] Video saved -> {output_path} ({file_size_mb:.1f} MB)")

        return {
            "status": "success",
            "local_path": output_path,
            "file_size_mb": round(file_size_mb, 2),
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "model": VEO_MODEL,
            "generation_time_seconds": attempts * VEO_POLL_INTERVAL,
        }

    except Exception as e:
        return {"status": "failed", "reason": f"Video download/save failed: {str(e)}"}


async def video_generation_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates a video using Veo 3.1 Lite via the Gemini API.

    Input:  state["video_prompt"] — cinematic frame-by-frame prompt
            state["platform"]     — instagram/youtube/linkedin/twitter
            state["session_id"]   — unique session identifier

    Output: state["generated_video"] — dict with local_path, url, metadata
            state["video_generation_success"] — True/False
    """
    session_id = state.get("session_id", str(uuid.uuid4()))
    platform = state.get("platform", "instagram").lower()
    video_prompt = state.get("video_prompt", "").strip()

    if not video_prompt:
        print("[VideoGen] No video_prompt in state. Skipping video generation.")
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + [
            "VideoGen skipped: video_prompt is empty"
        ]
        return state

    veo_config = _get_veo_config(platform)
    aspect_ratio = veo_config["aspect_ratio"]
    resolution = veo_config["resolution"]
    output_path = os.path.join(OUTPUT_DIR, f"{session_id}.mp4")

    print(f"[VideoGen] Starting Veo 3.1 Lite for platform: {platform}")
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            _generate_video_sync,
            video_prompt,
            aspect_ratio,
            resolution,
            output_path,
        )
    except Exception as e:
        print(f"[VideoGen] Executor error: {e}")
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + [f"VideoGen executor error: {str(e)}"]
        return state

    if result["status"] == "success":
        app_base_url = getattr(settings, "app_base_url", "http://localhost:8000")
        state["generated_video"] = {
            "local_path": result["local_path"],
            "url": f"{app_base_url}/outputs/videos/{session_id}.mp4",
            "source": VEO_MODEL,
            "aspect_ratio": result["aspect_ratio"],
            "resolution": result["resolution"],
            "file_size_mb": result.get("file_size_mb", 0),
            "generation_time_seconds": result.get("generation_time_seconds", 0),
        }
        state["video_generation_success"] = True
        print(f"[VideoGen] Success — {result['local_path']}")
    else:
        reason = result.get("reason", "Unknown error")
        print(f"[VideoGen] Failed — {reason}")
        state["video_generation_success"] = False
        state["generated_video"] = {}
        state["errors"] = state.get("errors", []) + [f"VideoGen failed: {reason}"]

    return state
