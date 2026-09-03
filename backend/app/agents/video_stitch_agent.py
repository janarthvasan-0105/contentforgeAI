import os
import uuid
import moviepy.editor as mp
from app.models.state import ContentForgeState
from app.services.brand_overlay import apply_logo_to_image
import io
from PIL import Image
import numpy as np
from app.services.storage_service import upload_media_to_supabase

async def video_stitch_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Stitches the interpolated video scenes together with hard cuts.
    Applies brand logo overlay to the video.
    """
    session_id = state.get("session_id", str(uuid.uuid4()))
    interpolated_scenes = state.get("interpolated_scenes", [])
    
    if not interpolated_scenes:
        return state

    os.makedirs("outputs/videos", exist_ok=True)
    final_output_path = f"outputs/videos/{session_id}_final.mp4"
    
    print("[VideoStitch] Stitching 4 scenes together...")

    try:
        clips = []
        for path in interpolated_scenes:
            if os.path.exists(path):
                clips.append(mp.VideoFileClip(path))
            else:
                print(f"[VideoStitch] Missing scene file: {path}")

        if not clips:
            raise Exception("No valid scene clips found to stitch.")

        # Hard cuts - just concatenate
        final_clip = mp.concatenate_videoclips(clips, method="compose")

        # Apply logo overlay
        logo_url = state.get("logo_url")
        if logo_url:
            print("[VideoStitch] Applying logo overlay...")
            # We can use apply_logo_to_image per frame, or download logo and use moviepy ImageClip overlay
            import requests
            try:
                logo_resp = requests.get(logo_url, timeout=10)
                if logo_resp.status_code == 200:
                    logo_img = Image.open(io.BytesIO(logo_resp.content)).convert("RGBA")
                    # Calculate target width (12% of video width)
                    target_width = int(final_clip.w * 0.12)
                    ratio = target_width / logo_img.width
                    target_height = int(logo_img.height * ratio)
                    logo_img = logo_img.resize((target_width, target_height))
                    
                    # Save to temp file because moviepy prefers file paths for ImageClip
                    temp_logo = f"outputs/videos/{session_id}_logo.png"
                    logo_img.save(temp_logo)
                    
                    padding = int(final_clip.w * 0.03)
                    logo_clip = (
                        mp.ImageClip(temp_logo)
                        .set_duration(final_clip.duration)
                        .set_position((final_clip.w - target_width - padding, final_clip.h - target_height - padding))
                    )
                    
                    final_clip = mp.CompositeVideoClip([final_clip, logo_clip])
            except Exception as e:
                print(f"[VideoStitch] Failed to apply logo overlay: {e}")

        # Write final video
        print(f"[VideoStitch] Rendering final video to {final_output_path}...")
        final_clip.write_videofile(final_output_path, fps=24, codec="libx264", audio_codec="aac", verbose=False, logger=None)

        # Cleanup clips
        for clip in clips:
            clip.close()
        final_clip.close()

        # Update state
        from app.config import get_settings
        settings = get_settings()
        app_base_url = getattr(settings, "app_base_url", "http://localhost:8000")
        
        file_size_mb = os.path.getsize(final_output_path) / (1024 * 1024)
        
        # Upload to Supabase Storage
        try:
            public_url = upload_media_to_supabase(final_output_path)
        except Exception as e:
            print(f"[Storage] Failed to upload video to Supabase: {e}")
            public_url = f"{app_base_url}/{final_output_path.replace(os.sep, '/')}"
        
        state["generated_video"] = {
            "local_path": final_output_path,
            "url": public_url,
            "source": "groq_ideogram_rife",
            "file_size_mb": round(file_size_mb, 2),
        }
        state["video_generation_success"] = True
        print(f"[VideoStitch] Success — {final_output_path}")

    except Exception as e:
        print(f"[VideoStitch] Failed: {e}")
        state["video_generation_success"] = False
        state["errors"] = state.get("errors", []) + [f"VideoStitch failed: {e}"]

    return state
