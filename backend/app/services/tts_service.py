"""
tts_service.py
──────────────
Generates professional Indian English voiceover using Google Cloud TTS.
Uses Wavenet voices for natural, broadcast-quality audio.
"""

import os
from google.cloud import texttospeech

TTS_LANGUAGE = os.getenv("TTS_LANGUAGE_CODE", "en-IN")
TTS_VOICE = os.getenv("TTS_VOICE_NAME", "en-IN-Wavenet-D")
TTS_RATE = float(os.getenv("TTS_SPEAKING_RATE", "0.90"))
TTS_PITCH = float(os.getenv("TTS_PITCH", "-2.0"))
OUTPUT_DIR = "outputs/voiceovers"


def generate_voiceover(script: str, output_filename: str) -> str:
    """
    Converts script text to professional MP3 voiceover.

    Args:
        script: The text to speak
        output_filename: e.g. "session_abc123.mp3"

    Returns:
        Local path to saved MP3 file
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # Use the existing GOOGLE_API_KEY
    from google.auth.api_key import Credentials
    credentials = Credentials(os.getenv("GOOGLE_API_KEY"))
    client = texttospeech.TextToSpeechClient(credentials=credentials)

    synthesis_input = texttospeech.SynthesisInput(text=script)

    voice = texttospeech.VoiceSelectionParams(
        language_code=TTS_LANGUAGE,
        name=TTS_VOICE,
        ssml_gender=texttospeech.SsmlVoiceGender.MALE,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=TTS_RATE,
        pitch=TTS_PITCH,
        effects_profile_id=["large-home-entertainment-class-device"],
    )

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config,
    )

    with open(output_path, "wb") as f:
        f.write(response.audio_content)

    print(f"[TTS] Voiceover saved → {output_path}")
    return output_path


def build_voiceover_script(video_script: dict, brand_name: str) -> str:
    """
    Builds a clean 8-second voiceover script from video_script state.
    Combines hook + value + cta into one flowing sentence.
    Targets ~120 words for 8 seconds at natural speaking pace.
    """
    hook = video_script.get("hook", "").strip()
    value = video_script.get("value", "").strip()
    cta = video_script.get("cta", "").strip()

    # Remove hashtags and social media specific text
    import re
    def clean(text):
        text = re.sub(r"#\w+", "", text)
        text = re.sub(r"\[.*?\]", "", text)
        text = text.strip(" .,!?")
        return text

    hook = clean(hook)
    value = clean(value)
    cta = clean(cta)

    # Build flowing voiceover — max 8 seconds = ~120 words
    parts = []
    if hook:
        parts.append(hook)
    if value:
        parts.append(value)
    if cta:
        parts.append(f"Visit {brand_name} today. {cta}")
    elif brand_name:
        parts.append(f"Download {brand_name} now.")

    script = ". ".join(filter(None, parts))

    # Truncate to ~120 words for 8 second video
    words = script.split()
    if len(words) > 120:
        script = " ".join(words[:120]) + "."

    return script
