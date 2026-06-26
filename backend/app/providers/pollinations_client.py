from urllib.parse import quote


def build_pollinations_image_url(prompt: str, width: int = 1024, height: int = 1024) -> str:
    """Build a free Pollinations image URL from a text prompt."""
    encoded = quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true"
