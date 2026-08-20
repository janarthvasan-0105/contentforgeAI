import os
import uuid
import asyncio
import moviepy.editor as mp
import shutil
import subprocess
from dotenv import load_dotenv
from app.models.state import ContentForgeState

load_dotenv()
LTX_VIDEO_PATH = os.environ.get("LTX_VIDEO_PATH", r"D:\ContentForge\LTX-Video")

def _create_scene_video_fallback(start_path: str, end_path: str, output_path: str, target_frames: int = 90) -> str:
    """
    Simple crossfade fallback using MoviePy if LTX-Video fails.
    """
    duration = target_frames / 24.0
    half_dur = duration / 2.0
    
    clip1 = mp.ImageClip(start_path).set_duration(half_dur + 0.5)
    clip2 = mp.ImageClip(end_path).set_duration(half_dur + 0.5)
    
    # Crossfade
    clip2 = clip2.crossfadein(1.0).set_start(half_dur - 0.5)
    final = mp.CompositeVideoClip([clip1, clip2]).set_duration(duration)
    
    final.write_videofile(output_path, fps=24, codec="libx264", audio=False, verbose=False, logger=None)
    return output_path

def _ltx_video_sync(start_path: str, end_path: str, motion_prompt: str, output_path: str, target_frames: int = 90, scene_tag: str = "scene") -> str:
    """
    Uses LTX-Video to interpolate between two keyframes using the motion prompt and export an MP4.
    If LTX-Video fails, falls back to moviepy crossfade.
    """
    if not os.path.exists(LTX_VIDEO_PATH):
        print(f"[LTX-Video] Repository not found at {LTX_VIDEO_PATH}. Falling back to MoviePy crossfade.")
        return _create_scene_video_fallback(start_path, end_path, output_path, target_frames)

    try:
        print(f"[LTX-Video] Interpolating frames for {scene_tag}...")
        
        # In a real environment, we call the inference script of LTX-Video.
        # Since exact CLI args depend on the specific inference.py, we invoke it via subprocess.
        # This assumes the standard `inference.py` interface.
        
        inference_script = os.path.join(LTX_VIDEO_PATH, "inference.py")
        if not os.path.exists(inference_script):
            raise FileNotFoundError(f"inference.py not found in {LTX_VIDEO_PATH}")
            
        cmd = [
            "python", inference_script,
            "--prompt", motion_prompt,
            "--image_path", start_path,
            "--end_image_path", end_path,
            "--output_path", output_path,
            "--num_frames", str(target_frames)
        ]
        
        env = os.environ.copy()
        # You may want to specify CUDA devices or paths here
        
        result = subprocess.run(
            cmd,
            cwd=LTX_VIDEO_PATH,
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"LTX-Video inference failed: {result.stderr}")
            
        print(f"[LTX-Video] Video generated successfully for {scene_tag}.")
        return output_path

    except Exception as e:
        print(f"[LTX-Video] Interpolation failed: {e}. Falling back to MoviePy.")
        return _create_scene_video_fallback(start_path, end_path, output_path, target_frames)

async def ltx_interpolation_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Takes 8 keyframes from Ideogram and uses LTX-Video to generate motion
    between the start and end frames of each of the 4 scenes using the motion prompt.
    Outputs 4 short video clips (1 per scene).
    """
    session_id = state.get("session_id", str(uuid.uuid4()))
    video_keyframes = state.get("video_keyframes", [])
    video_scenes_schema = state.get("video_scenes_schema", {})
    
    if not video_keyframes or len(video_keyframes) != 8:
        return state

    os.makedirs("outputs/videos", exist_ok=True)
    interpolated_scenes = []
    
    print("[LTX-Video] Starting frame interpolation for 4 scenes...")
    
    loop = asyncio.get_event_loop()
    scenes = video_scenes_schema.get("scenes", [])
    
    for i in range(4):
        start_path = video_keyframes[i * 2]
        end_path = video_keyframes[(i * 2) + 1]
        scene_output = f"outputs/videos/{session_id}_scene_{i+1}.mp4"
        scene_tag = f"{session_id}_scene_{i+1}"
        
        # Get motion prompt for this scene
        motion_prompt = "Camera pans slowly. Smooth cinematic movement."
        if i < len(scenes):
            motion_prompt = scenes[i].get("motion_prompt", motion_prompt)
            
        print(f"[LTX-Video] Processing Scene {i+1}/4...")
        target_frames = 90 
        
        try:
            result_path = await loop.run_in_executor(
                None,
                _ltx_video_sync,
                start_path,
                end_path,
                motion_prompt,
                scene_output,
                target_frames,
                scene_tag
            )
            interpolated_scenes.append(result_path)
            print(f"[LTX-Video] Scene {i+1} complete: {result_path}")
        except Exception as e:
            print(f"[LTX-Video] Scene {i+1} fatal error: {e}")
            state["errors"] = state.get("errors", []) + [f"LTX-Video Scene {i+1} fatal error: {e}"]
            state["video_generation_success"] = False
            return state

    state["interpolated_scenes"] = interpolated_scenes
    return state
