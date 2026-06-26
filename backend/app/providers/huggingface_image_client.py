import httpx
from app.config import get_settings

settings = get_settings()

HF_MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"


async def generate_hf_image(prompt: str, output_path: str) -> str:
    """Generate an image using Hugging Face Inference API as fallback."""
    headers = {}
    if getattr(settings, "hf_api_token", None):
        headers["Authorization"] = f"Bearer {settings.hf_api_token}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(HF_MODEL_URL, headers=headers, json={"inputs": prompt})
        response.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(response.content)
    return output_path
