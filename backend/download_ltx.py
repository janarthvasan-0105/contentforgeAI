import os
from huggingface_hub import snapshot_download

def download_ltx_video_weights():
    print("Downloading LTX-Video weights from HuggingFace...")
    # Typically LTX-Video uses Lightricks/LTX-Video
    # We download it to a specific directory
    target_dir = os.path.join(os.environ.get("LTX_VIDEO_PATH", r"D:\ContentForge\LTX-Video"), "checkpoints")
    
    os.makedirs(target_dir, exist_ok=True)
    
    try:
        snapshot_download(
            repo_id="Lightricks/LTX-Video",
            local_dir=target_dir,
            local_dir_use_symlinks=False
        )
        print(f"Successfully downloaded weights to {target_dir}")
    except Exception as e:
        print(f"Failed to download weights: {e}")

if __name__ == "__main__":
    download_ltx_video_weights()
