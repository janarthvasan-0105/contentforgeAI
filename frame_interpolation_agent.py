"""
FrameInterpolationAgent — ContentForge AI (CPU-only)

Setup (one-time):
    git clone https://github.com/hzwer/Practical-RIFE.git ~/Practical-RIFE
    cd ~/Practical-RIFE
    pip install -r requirements.txt
    # download pretrained weights per their README into ~/Practical-RIFE/train_log/

Usage:
    agent = FrameInterpolationAgent()
    frames = agent.interpolate_scene(start_path, end_path, num_frames, output_dir, scene_tag)

Behavior:
    - Runs entirely on CPU. Slower per scene than GPU, but no driver/CUDA setup needed.
    - If the RIFE model can't be loaded at all -> falls back to crossfade for every scene.
    - If RIFE loads but fails mid-scene -> falls back to crossfade for that scene only.
    Either way, a job never hard-fails.
"""

import os
import sys
import logging
from pathlib import Path

logger = logging.getLogger("FrameInterpolationAgent")

PRACTICAL_RIFE_PATH = os.environ.get(
    "PRACTICAL_RIFE_PATH",
    str(Path.home() / "Practical-RIFE"),
)


class FrameInterpolationAgent:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or PRACTICAL_RIFE_PATH
        self.model = None
        self.available = False
        self._load_model()

    def _load_model(self):
        try:
            train_log_dir = os.path.join(self.model_path, "train_log")
            if train_log_dir not in sys.path:
                sys.path.insert(0, train_log_dir)

            from RIFE_HDv3 import Model  # from Practical-RIFE repo

            self.model = Model()
            self.model.load_model(train_log_dir, -1)
            self.model.eval()
            # Force CPU — no .device() call, no cuda references.
            self.available = True
            logger.info("[RIFE] Model loaded (CPU).")

        except Exception as e:
            logger.warning(
                f"[RIFE] Could not load model ({e}). "
                f"Every scene will use the crossfade fallback."
            )
            self.available = False

    def interpolate_scene(self, start_path, end_path, num_frames, output_dir, scene_tag="scene"):
        os.makedirs(output_dir, exist_ok=True)

        if not self.available:
            return self._crossfade_fallback(start_path, end_path, num_frames, output_dir, scene_tag)

        try:
            return self._rife_interpolate(start_path, end_path, num_frames, output_dir, scene_tag)
        except Exception as e:
            logger.warning(f"[RIFE] Failed mid-scene for {scene_tag} ({e}). Using crossfade for this scene.")
            return self._crossfade_fallback(start_path, end_path, num_frames, output_dir, scene_tag)

    def _rife_interpolate(self, start_path, end_path, num_frames, output_dir, scene_tag):
        import cv2
        import torch
        import torch.nn.functional as F

        img0 = cv2.imread(start_path)
        img1 = cv2.imread(end_path)

        img0_t = self._to_tensor(img0)
        img1_t = self._to_tensor(img1)

        _, _, h, w = img0_t.shape
        ph = ((h - 1) // 32 + 1) * 32
        pw = ((w - 1) // 32 + 1) * 32
        padding = (0, pw - w, 0, ph - h)
        img0_t = F.pad(img0_t, padding)
        img1_t = F.pad(img1_t, padding)

        num_middle = max(num_frames - 2, 0)
        frame_paths = []

        start_out = os.path.join(output_dir, f"{scene_tag}_frame_0000.png")
        cv2.imwrite(start_out, img0)
        frame_paths.append(start_out)

        if num_middle > 0:
            timesteps = [i / (num_middle + 1) for i in range(1, num_middle + 1)]
            for idx, t in enumerate(timesteps, start=1):
                with torch.no_grad():
                    mid = self.model.inference(img0_t, img1_t, t)
                mid_img = (mid[0] * 255.0).byte().numpy().transpose(1, 2, 0)[:h, :w]
                out_path = os.path.join(output_dir, f"{scene_tag}_frame_{idx:04d}.png")
                cv2.imwrite(out_path, mid_img)
                frame_paths.append(out_path)

        end_out = os.path.join(output_dir, f"{scene_tag}_frame_{num_frames - 1:04d}.png")
        cv2.imwrite(end_out, img1)
        frame_paths.append(end_out)

        logger.info(f"[RIFE] {scene_tag}: generated {len(frame_paths)} frames ({num_middle} interpolated, CPU).")
        return frame_paths

    def _to_tensor(self, img_bgr):
        import torch

        img = img_bgr[:, :, ::-1].copy()  # BGR -> RGB
        t = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
        return t.unsqueeze(0)

    def _crossfade_fallback(self, start_path, end_path, num_frames, output_dir, scene_tag):
        from PIL import Image
        import numpy as np

        img0 = np.array(Image.open(start_path).convert("RGB"))
        img1 = np.array(Image.open(end_path).convert("RGB"))

        frame_paths = []
        for i in range(num_frames):
            alpha = i / max(num_frames - 1, 1)
            blended = (img0 * (1 - alpha) + img1 * alpha).astype("uint8")
            out_path = os.path.join(output_dir, f"{scene_tag}_frame_{i:04d}.png")
            Image.fromarray(blended).save(out_path)
            frame_paths.append(out_path)

        logger.info(f"[RIFE] {scene_tag}: crossfade fallback produced {len(frame_paths)} frames.")
        return frame_paths


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) < 5:
        print("Usage: python frame_interpolation_agent.py <start.png> <end.png> <num_frames> <output_dir> [scene_tag]")
        sys.exit(1)

    start_path, end_path, num_frames, output_dir = sys.argv[1:5]
    scene_tag = sys.argv[5] if len(sys.argv) > 5 else "scene_test"

    agent = FrameInterpolationAgent()
    frames = agent.interpolate_scene(start_path, end_path, int(num_frames), output_dir, scene_tag)
    print(f"Wrote {len(frames)} frames to {output_dir}")
