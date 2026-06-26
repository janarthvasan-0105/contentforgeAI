from app.models.state import ContentForgeState
from app.config import get_settings
from app.services.compositor_service import (
    composite_logo_onto_poster
)
import os
import httpx

settings = get_settings()

async def image_generation_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generate image using Ideogram API.
    After generation, composite brand logo onto poster if available.
    """
    session_id = state.get("session_id", "default_session")
    image_prompts = state.get("image_prompts", [])
    brand_name = state.get("brand_name", "Brand")
    platform = state.get("platform", "instagram").lower()

    # Get brand identity for logo compositing
    brand_identity = state.get("brand_identity", {})
    logo_path = brand_identity.get("logo_local_path", "") if brand_identity else ""
    logo_available = brand_identity.get("logo_compositing", False) if brand_identity else False

    if not image_prompts:
        print("[Ideogram] No image prompts found in state.")
        state["image_generation_success"] = False
        state["use_playwright_fallback"] = True
        return state

    if not settings.ideogram_api_key:
        print("[Ideogram] No IDEOGRAM_API_KEY set. Bypassing to Playwright fallback.")
        state["image_generation_success"] = False
        state["use_playwright_fallback"] = True
        return state

    generated_images = []
    os.makedirs("outputs/images", exist_ok=True)

    # Map platform to Ideogram aspect ratios
    platform_aspect_map = {
        "instagram": "ASPECT_1_1",
        "youtube": "ASPECT_16_9",
        "linkedin": "ASPECT_16_9",
        "twitter": "ASPECT_16_9",
    }
    aspect_ratio = platform_aspect_map.get(platform, "ASPECT_1_1")

    try:
        headers = {
            "Api-Key": settings.ideogram_api_key,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            for index, prompt in enumerate(image_prompts):
                payload = {
                    "text_prompt": prompt,
                    "aspect_ratio": aspect_ratio
                }
                
                print(f"[Ideogram] Generating image {index+1}/{len(image_prompts)}: aspect={aspect_ratio}...")
                response = await client.post(
                    "https://api.ideogram.ai/v1/ideogram-v4/generate",
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    raise Exception(f"Ideogram API error ({response.status_code}): {response.text}")

                res_json = response.json()
                img_data = res_json.get("data", [])
                if not img_data or not img_data[0].get("url"):
                    raise Exception(f"No image URL returned in data: {res_json}")

                img_url = img_data[0]["url"]
                print(f"[Ideogram] Downloading generated image from {img_url}...")
                
                img_resp = await client.get(img_url)
                img_resp.raise_for_status()

                raw_path = f"outputs/images/{session_id}_{index}.png"
                with open(raw_path, "wb") as f:
                    f.write(img_resp.content)

                final_path = raw_path

                # ── Logo Compositing ──────────────────────────────────
                if logo_available and logo_path and os.path.exists(logo_path):
                    try:
                        composited_path = composite_logo_onto_poster(
                            poster_path=raw_path,
                            logo_path=logo_path,
                            brand_name=brand_name,
                            position="top-left"
                        )
                        final_path = composited_path
                        print(f"[Compositor] Logo composited onto image {index}")
                    except Exception as e:
                        print(f"[Compositor] Logo compositing failed: {e}")

                generated_images.append({
                    "local_path": final_path,
                    "raw_path": raw_path,
                    "source": "ideogram",
                    "fallback_used": False,
                    "logo_composited": logo_available and bool(logo_path) and os.path.exists(logo_path)
                })

        state["generated_images"] = generated_images
        state["image_generation_success"] = True
        state["use_playwright_fallback"] = False
        state["rendered_post_urls"] = [
            f"{settings.app_base_url}/outputs/images/{session_id}_{i}.png"
            for i in range(len(generated_images))
        ]
        print(f"[Ideogram] Successfully generated {len(generated_images)} images.")

    except Exception as e:
        print(f"[Ideogram] Image generation failed: {e}")
        state["image_generation_success"] = False
        state["use_playwright_fallback"] = True

    return state
