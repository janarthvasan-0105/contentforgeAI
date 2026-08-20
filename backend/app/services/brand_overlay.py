import io
import os
import subprocess
import tempfile
import requests
from PIL import Image


def apply_logo_to_image(image_bytes: bytes, logo_url: str | None) -> bytes:
    """Corner watermark overlay for generated posts."""
    if not logo_url:
        return image_bytes

    try:
        base = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        logo_resp = requests.get(logo_url, timeout=10)
        logo = Image.open(io.BytesIO(logo_resp.content)).convert("RGBA")

        target_width = int(base.width * 0.12)
        ratio = target_width / logo.width
        logo = logo.resize((target_width, int(logo.height * ratio)))

        padding = int(base.width * 0.03)
        position = (base.width - logo.width - padding, base.height - logo.height - padding)
        base.paste(logo, position, logo)

        output = io.BytesIO()
        base.convert("RGB").save(output, format="JPEG", quality=92)
        return output.getvalue()
    except Exception as e:
        print(f"Failed to apply logo to image: {e}")
        return image_bytes


def _get_video_resolution(path: str) -> tuple[int, int]:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", path],
        capture_output=True, text=True, check=True,
    )
    w, h = result.stdout.strip().split("x")
    return int(w), int(h)


def apply_logo_to_video(video_path: str, logo_url: str | None, output_path: str) -> str:
    """Adds a 1.5s intro card and 1.5s outro card with the logo centered, matching main video's resolution."""
    if not logo_url:
        return video_path

    try:
        width, height = _get_video_resolution(video_path)

        with tempfile.TemporaryDirectory() as tmp:
            logo_path = os.path.join(tmp, "logo.png")
            logo_resp = requests.get(logo_url, timeout=10)
            with open(logo_path, "wb") as f:
                f.write(logo_resp.content)

            intro_path = os.path.join(tmp, "intro.mp4")
            outro_path = os.path.join(tmp, "outro.mp4")

            for card_path in (intro_path, outro_path):
                subprocess.run([
                    "ffmpeg", "-y",
                    "-f", "lavfi", "-i", f"color=c=black:s={width}x{height}:d=1.5",
                    "-i", logo_path,
                    "-filter_complex",
                    f"[1:v]scale={int(width*0.35)}:-1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2,format=yuv420p",
                    "-t", "1.5",
                    card_path,
                ], check=True)

            # Use the concat filter (not demuxer) — re-encodes, so mismatched
            # codecs/framerates between the cards and the Veo3 clip are handled safely.
            subprocess.run([
                "ffmpeg", "-y",
                "-i", intro_path, "-i", video_path, "-i", outro_path,
                "-filter_complex",
                "[0:v][1:v][2:v]concat=n=3:v=1:a=0[outv]",
                "-map", "[outv]",
                output_path,
            ], check=True)

        return output_path
    except Exception as e:
        print(f"Failed to apply logo to video: {e}")
        return video_path
