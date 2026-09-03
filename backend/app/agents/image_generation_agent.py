from app.models.state import ContentForgeState
from app.config import get_settings
from app.services.compositor_service import composite_logo_onto_poster
from app.services.brand_overlay import apply_logo_to_image
from app.services.storage_service import upload_media_to_supabase
import os
import httpx
import uuid

settings = get_settings()

async def image_generation_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generate image using Ideogram API.
    After generation, composite brand logo onto poster if available.
    Also handles 8-keyframe generation for the Groq + RIFE video pipeline.
    """
    session_id = state.get("session_id", str(uuid.uuid4()))
    platform = state.get("platform", "instagram").lower()
    brand_name = state.get("brand_name", "Brand")

    brand_identity = state.get("brand_identity", {})
    logo_path = brand_identity.get("logo_local_path", "") if brand_identity else ""
    logo_available = brand_identity.get("logo_compositing", False) if brand_identity else False
    logo_url = state.get("logo_url")

    video_schema = state.get("video_scenes_schema")
    image_prompts = state.get("image_prompts", [])
    
    is_video = bool(video_schema)

    if not is_video and not image_prompts:
        print("[Ideogram] No image prompts or video schema found in state.")
        state["image_generation_success"] = False
        state["use_playwright_fallback"] = True
        return state

    if not settings.ideogram_api_key:
        print("[Ideogram] No IDEOGRAM_API_KEY set. Bypassing to Playwright fallback/Failing.")
        state["image_generation_success"] = False
        state["use_playwright_fallback"] = True
        return state

    os.makedirs("outputs/images", exist_ok=True)

    platform_aspect_map = {
        "instagram": "ASPECT_9_16", # Updated to match standard vertical, though old code had ASPECT_1_1 for some reason
        "youtube": "ASPECT_16_9",
        "linkedin": "ASPECT_16_9",
        "twitter": "ASPECT_16_9",
    }
    if not is_video:
        aspect_ratio = platform_aspect_map.get(platform, "ASPECT_1_1")
    else:
        # Video always uses the platform specific ratio correctly
        video_aspect_map = {
            "instagram": "ASPECT_9_16",
            "youtube": "ASPECT_16_9",
            "linkedin": "ASPECT_16_9",
            "twitter": "ASPECT_16_9",
        }
        aspect_ratio = video_aspect_map.get(platform, "ASPECT_9_16")

    headers = {
        "Api-Key": settings.ideogram_api_key,
        "Content-Type": "application/json"
    }

    generated_images = []
    video_keyframes = []

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            
            # --- VIDEO KEYFRAME GENERATION ---
            if is_video:
                scenes = video_schema.get("scenes", [])
                print(f"[Ideogram] Generating {len(scenes) * 2} video keyframes...")
                
                # Base seed to keep consistency within a scene
                base_seed = 42000
                
                frame_count = 0
                for scene_idx, scene in enumerate(scenes):
                    style = scene.get("style_reference", "")
                    scene_seed = base_seed + scene_idx
                    
                    for kf_key in ["keyframe_start", "keyframe_end"]:
                        prompt = scene.get(kf_key, {}).get("prompt", "")
                        # Append style to prompt if not already present
                        full_prompt = f"{prompt}. {style}"
                        
                        payload = {
                            "text_prompt": full_prompt,
                            "aspect_ratio": aspect_ratio,
                            "seed": scene_seed
                        }
                        
                        print(f"[Ideogram] Generating video keyframe {frame_count+1}/8 (Scene {scene_idx+1} {kf_key})...")
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
                        img_resp = await client.get(img_url)
                        img_resp.raise_for_status()

                        raw_path = f"outputs/images/{session_id}_kf_{frame_count}.png"
                        with open(raw_path, "wb") as f:
                            f.write(img_resp.content)
                            
                        # No logo compositing on raw keyframes, logo is applied in video stitcher
                        video_keyframes.append(raw_path)
                        frame_count += 1

                state["video_keyframes"] = video_keyframes
                state["image_generation_success"] = True
                print(f"[Ideogram] Successfully generated {len(video_keyframes)} video keyframes.")
                return state
                
            # --- STANDARD IMAGE GENERATION ---
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
                if logo_url:
                    print("[Compositor] Applying Supabase logo watermark...")
                    composited_bytes = apply_logo_to_image(img_resp.content, logo_url)
                    with open(raw_path, "wb") as f:
                        f.write(composited_bytes)
                elif logo_available and logo_path and os.path.exists(logo_path):
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

                # Upload to Supabase Storage
                try:
                    public_url = upload_media_to_supabase(final_path)
                except Exception as e:
                    print(f"[Storage] Failed to upload image to Supabase: {e}")
                    public_url = f"{settings.app_base_url}/outputs/images/{session_id}_{index}.png" # fallback

                generated_images.append({
                    "local_path": final_path,
                    "raw_path": raw_path,
                    "public_url": public_url,
                    "source": "ideogram",
                    "fallback_used": False,
                    "logo_composited": logo_available and bool(logo_path) and os.path.exists(logo_path)
                })

        state["generated_images"] = generated_images
        state["image_generation_success"] = True
        state["use_playwright_fallback"] = False
        state["rendered_post_urls"] = [
            img["public_url"] for img in generated_images
        ]
        print(f"[Ideogram] Successfully generated {len(generated_images)} images.")

    except Exception as e:
        print(f"[Ideogram] Image generation failed: {e}")
        state["image_generation_success"] = False
        state["use_playwright_fallback"] = True
        if is_video:
            state["errors"] = state.get("errors", []) + [f"Ideogram video keyframe failure: {e}"]

    return state
