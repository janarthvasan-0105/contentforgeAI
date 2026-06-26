"""
Gemini Poster Generator — generates complete branded social media posters
using Gemini's native image generation (Imagen 3) via the google-genai SDK.
"""
import os
import uuid
import asyncio
from google import genai
from google.genai import types
from app.config import get_settings

settings = get_settings()
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "render", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def _generate_poster_sync(prompt: str, output_path: str) -> bool:
    """Synchronous poster generation — run inside asyncio.to_thread."""
    try:
        client = genai.Client(api_key=settings.gemini_api)
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/png",
            ),
        )
        if response.generated_images:
            response.generated_images[0].image.save(output_path)
            return True
        else:
            print(f"Gemini returned no images for prompt: {prompt[:80]}...")
            return False
    except Exception as e:
        print(f"Gemini image generation error: {e}")
        return False


async def generate_poster(prompt: str, output_path: str) -> bool:
    """Async wrapper around the sync Gemini call."""
    return await asyncio.to_thread(_generate_poster_sync, prompt, output_path)
