"""
video_overlay_agent.py
──────────────────────
Adds professional text overlays and voiceover to Veo-generated video.

Pipeline:
  1. Extract 2-3 word text overlays from video_script (hook, value, cta, brand)
  2. Generate voiceover MP3 via Google TTS
  3. Apply professional FFmpeg text overlays with fade animations
  4. Merge voiceover audio into video
  5. Save final professional ad video
  6. Also generate multilingual versions if languages specified
"""

import os
import re
import asyncio
import subprocess
from typing import List, Optional

from app.models.state import ContentForgeState
from app.services.tts_service import generate_voiceover, build_voiceover_script


# ── Text extraction ───────────────────────────────────────────────────────────

def _extract_short_overlays(video_script: dict, brand_name: str) -> List[dict]:
    """
    Extracts 2-3 word professional text overlays from video_script.
    Returns list of {text, start_sec, end_sec} timed to 8-second video.

    Overlay schedule for 8s video:
      0.5s - 2.5s : Hook phrase
      2.5s - 4.5s : Value phrase
      4.5s - 6.5s : Benefit/CTA phrase
      6.5s - 8.0s : Brand name
    """

    def shorten(text: str, max_words: int = 3) -> str:
        """Extract the most impactful 2-3 words from a sentence."""
        if not text:
            return ""
        # Remove hashtags, brackets, links
        text = re.sub(r"#\w+", "", text)
        text = re.sub(r"\[.*?\]", "", text)
        text = re.sub(r"http\S+", "", text)
        text = text.strip(" .,!?")

        words = text.split()
        if len(words) <= max_words:
            return text

        # Take first N words — they carry the most impact
        return " ".join(words[:max_words]) + "."

    hook_raw = video_script.get("hook", "")
    value_raw = video_script.get("value", "")
    cta_raw = video_script.get("cta", "")

    hook_short = shorten(hook_raw, 3)
    value_short = shorten(value_raw, 3)
    cta_short = shorten(cta_raw, 2)
    brand_short = brand_name.strip()

    overlays = []

    if hook_short:
        overlays.append({"text": hook_short, "start_sec": 0.5, "end_sec": 2.3})

    if value_short:
        overlays.append({"text": value_short, "start_sec": 2.5, "end_sec": 4.3})

    if cta_short:
        overlays.append({"text": cta_short, "start_sec": 4.5, "end_sec": 6.3})

    if brand_short:
        overlays.append({"text": brand_short, "start_sec": 6.5, "end_sec": 7.8})

    return overlays


# ── FFmpeg font setup ─────────────────────────────────────────────────────────

FONT_MAP = {
    "english":    "fonts/NotoSans-Bold.ttf",
    "tamil":      "fonts/NotoSansTamil-Bold.ttf",
    "malayalam":  "fonts/NotoSansMalayalam-Bold.ttf",
    "telugu":     "fonts/NotoSansTelugu-Bold.ttf",
    "hindi":      "fonts/NotoSansDevanagari-Bold.ttf",
}

LANGUAGE_TEXT = {
    "tamil": {
        "hook":  "வீடு கண்டுபிடி.",
        "value": "தரகர் இல்லை.",
        "cta":   "இலவசம் பதிவிறக்கு.",
    },
    "hindi": {
        "hook":  "घर खोजें।",
        "value": "दलाल नहीं।",
        "cta":   "मुफ्त डाउनलोड।",
    },
    "malayalam": {
        "hook":  "വീട് കണ്ടെത്തൂ.",
        "value": "ബ്രോക്കർ ഇല്ല.",
        "cta":   "സൗജന്യം ഡൗൺലോഡ്.",
    },
    "telugu": {
        "hook":  "ఇల్లు కనుగొనండి.",
        "value": "దళారీ లేదు.",
        "cta":   "ఉచితంగా డౌన్లోడ్.",
    },
}


# ── FFmpeg overlay builder ────────────────────────────────────────────────────

def _build_drawtext_filter(
    overlays: List[dict],
    font_path: str,
    font_size: int = 72,
    video_height: int = 1280,
    video_width: int = 720,
) -> str:
    """
    Builds FFmpeg drawtext filter chain for professional animated text.

    Text style:
    - Large bold white text
    - Black drop shadow for contrast
    - Fade in 0.3s, hold, fade out 0.2s
    - Positioned at lower-left (x=60, y=75% of frame)
    - All on one clean drawtext filter per overlay
    """
    filters = []

    y_position = int(video_height * 0.72)

    for overlay in overlays:
        text = overlay["text"].replace("'", "\u2019").replace(":", "\\:")
        start = overlay["start_sec"]
        end = overlay["end_sec"]
        fade_in_end = start + 0.3
        fade_out_start = end - 0.2

        # Alpha expression: fade in, hold, fade out
        alpha_expr = (
            f"if(lt(t,{start}),0,"
            f"if(lt(t,{fade_in_end}),(t-{start})/0.3,"
            f"if(lt(t,{fade_out_start}),1,"
            f"if(lt(t,{end}),({end}-t)/0.2,0))))"
        )

        drawtext = (
            f"drawtext="
            f"fontfile={font_path}:"
            f"text='{text}':"
            f"fontcolor=white:"
            f"fontsize={font_size}:"
            f"x=60:"
            f"y={y_position}:"
            f"alpha='{alpha_expr}':"
            f"shadowcolor=black@0.8:"
            f"shadowx=3:"
            f"shadowy=3"
        )

        filters.append(drawtext)

    return ",".join(filters)


# ── FFmpeg runner ─────────────────────────────────────────────────────────────

def _apply_overlay_ffmpeg(
    input_video: str,
    output_video: str,
    overlays: List[dict],
    font_path: str,
    voiceover_path: Optional[str] = None,
    font_size: int = 72,
) -> bool:
    """
    Applies text overlays and optional voiceover to video using FFmpeg.
    Returns True on success.
    """
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    drawtext_filter = _build_drawtext_filter(overlays, font_path, font_size)

    if voiceover_path and os.path.exists(voiceover_path):
        # Mix voiceover with any existing video audio (or add if none)
        cmd = [
            "ffmpeg", "-y",
            "-i", input_video,
            "-i", voiceover_path,
            "-filter_complex",
            f"[0:v]{drawtext_filter}[vout];"
            f"[1:a]volume=1.0[aout]",
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", "libx264", "-crf", "18", "-preset", "slow",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            output_video
        ]
    else:
        # Text overlay only — no audio
        cmd = [
            "ffmpeg", "-y",
            "-i", input_video,
            "-vf", drawtext_filter,
            "-c:v", "libx264", "-crf", "18", "-preset", "slow",
            "-c:a", "copy",
            output_video
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[Overlay] FFmpeg failed: {result.stderr[-500:]}")
        return False

    print(f"[Overlay] Professional overlay applied → {output_video}")
    return True


# ── Main agent ────────────────────────────────────────────────────────────────

async def video_overlay_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Applies professional text overlays and voiceover to generated video.

    Steps:
    1. Extract 2-3 word overlays from video_script
    2. Generate voiceover via Google TTS
    3. Apply FFmpeg text overlay + voiceover to base video
    4. Generate multilingual versions for specified languages
    """
    session_id = state.get("session_id", "default")
    platform = state.get("platform", "instagram").lower()
    brand_name = state.get("brand_name", "Brand")
    video_script = state.get("video_script", {})
    languages = state.get("languages", ["english"])

    generated_video = state.get("generated_video", {})
    input_video = generated_video.get("local_path", "")

    if not input_video or not os.path.exists(input_video):
        print(f"[Overlay] No input video found at: {input_video}")
        state["errors"] = state.get("errors", []) + [
            "Overlay skipped: generated video not found"
        ]
        return state

    # ── Step 1: Extract 2-3 word text overlays ────────────────────────────
    overlays = _extract_short_overlays(video_script, brand_name)
    state["video_text_overlays"] = overlays
    print(f"[Overlay] Extracted {len(overlays)} text overlays:")
    for o in overlays:
        print(f"  [{o['start_sec']}s-{o['end_sec']}s] '{o['text']}'")

    # ── Step 2: Generate English voiceover ───────────────────────────────
    voiceover_path = None
    try:
        voiceover_script = build_voiceover_script(video_script, brand_name)
        state["voiceover_script"] = voiceover_script
        print(f"[Overlay] Voiceover script: {voiceover_script[:100]}...")

        voiceover_path = await asyncio.get_event_loop().run_in_executor(
            None,
            generate_voiceover,
            voiceover_script,
            f"{session_id}_en.mp3"
        )
        state["voiceover_path"] = voiceover_path
        print(f"[Overlay] Voiceover generated → {voiceover_path}")

    except Exception as e:
        print(f"[Overlay] Voiceover generation failed (continuing without): {e}")
        voiceover_path = None

    # ── Step 3: Apply English overlay + voiceover ─────────────────────────
    output_dir = "outputs/videos/overlaid"
    os.makedirs(output_dir, exist_ok=True)

    english_output = os.path.join(output_dir, f"{session_id}_english.mp4")
    english_font = FONT_MAP.get("english", "fonts/NotoSans-Bold.ttf")

    success = _apply_overlay_ffmpeg(
        input_video=input_video,
        output_video=english_output,
        overlays=overlays,
        font_path=english_font,
        voiceover_path=voiceover_path,
    )

    language_videos = {}
    if success:
        language_videos["english"] = english_output
        print(f"[Overlay] English version complete → {english_output}")

    # ── Step 4: Generate multilingual versions ────────────────────────────
    for lang in languages:
        if lang == "english":
            continue

        lang_lower = lang.lower()
        font_path = FONT_MAP.get(lang_lower, FONT_MAP["english"])

        # Get translated short overlays for this language
        lang_texts = LANGUAGE_TEXT.get(lang_lower, {})
        if lang_texts:
            lang_overlays = [
                {"text": lang_texts.get("hook", overlays[0]["text"] if overlays else ""),
                 "start_sec": 0.5, "end_sec": 2.3},
                {"text": lang_texts.get("value", overlays[1]["text"] if len(overlays) > 1 else ""),
                 "start_sec": 2.5, "end_sec": 4.3},
                {"text": lang_texts.get("cta", overlays[2]["text"] if len(overlays) > 2 else ""),
                 "start_sec": 4.5, "end_sec": 6.3},
                {"text": brand_name, "start_sec": 6.5, "end_sec": 7.8},
            ]
        else:
            lang_overlays = overlays

        lang_output = os.path.join(output_dir, f"{session_id}_{lang_lower}.mp4")

        lang_success = _apply_overlay_ffmpeg(
            input_video=input_video,
            output_video=lang_output,
            overlays=lang_overlays,
            font_path=font_path,
            voiceover_path=None,  # English voiceover only for now
        )

        if lang_success:
            language_videos[lang_lower] = lang_output
            print(f"[Overlay] {lang} version complete → {lang_output}")

    state["language_videos"] = language_videos
    print(f"[Overlay] All versions complete: {list(language_videos.keys())}")

    return state
