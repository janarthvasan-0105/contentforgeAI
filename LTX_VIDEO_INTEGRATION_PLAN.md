# ContentForge AI — LTX-Video Integration + RIFE Removal Plan

**Status:** Replacing the RIFE-interpolation approach with LTX-Video keyframe interpolation.
**Owner:** JAANU
**Last updated:** 2026-07-09

---

## 0. Critical Instructions for Agents Building This

1. This plan REPLACES the RIFE-based `FrameInterpolationAgent` only. It does NOT touch:
   - The original Veo 3.0 pipeline (still paused in `waste/`, per the earlier rebuild plan — leave it exactly where it is)
   - `VideoPromptAgent` scene/schema generation logic (Groq) — only the OUTPUT schema changes slightly (see Section 3), not the agent's core logic
   - `ImageGenerationAgent` (Ideogram) — unchanged, still generates keyframes
   - `VideoStitchAgent` (moviepy) — unchanged, still handles final stitching, audio, overlays, hard cuts between scenes
   - `ResearchAgent`, `ScriptAgent`, `HashtagAgent`, `TwitterPublisherAgent` — unaffected
2. RIFE-specific files (Section 1 below) should be **deleted outright**, not moved to `waste/`. Unlike the Veo pipeline (which is a paused-but-valid legacy system), the RIFE approach was an experimental dead end we built and are now discarding — it has no future re-enable value.
3. If any file mixes RIFE-specific code with other logic (e.g., a shared utils file), **do not delete the whole file** — remove only the RIFE-specific functions/imports from it and leave the rest intact. Ask before deleting if unsure whether a file is RIFE-only.

---

## 1. Files/Code to DELETE (RIFE-specific)

Delete these outright:

- `frame_interpolation_agent.py` (the RIFE/Practical-RIFE wrapper — CPU version)
- Any `PRACTICAL_RIFE_PATH` environment variable entries in `.env` / config files
- Any reference to `rife-ncnn-vulkan` or `rife-ncnn-vulkan-python` in requirements files or import statements
- Any local clone of the `Practical-RIFE` repo on disk (e.g., `D:\~\Practical-RIFE`) — this is a standalone model folder, not part of the git repo, safe to delete from the filesystem directly
- Any test output folders created during RIFE testing (e.g., `./test_out`, crossfade fallback test images)
- Remove the `FrameInterpolationAgent` import/call from wherever the video pipeline orchestration wires agents together (e.g., the LangGraph node graph / pipeline definition file) — replace this specific node with the new `LTXInterpolationAgent` (Section 4)

**Do NOT delete:**
- Anything under the Veo `waste/` folder
- `VideoPromptAgent`, `ImageGenerationAgent`, `VideoStitchAgent` files themselves (only their internal wiring to the interpolation step changes)

---

## 2. Why This Change

RIFE-based interpolation (optical-flow blending between two static keyframes) produced warped/ghosted results whenever the two keyframes weren't near-identical — this was a structural limitation of that technique, not a bug. LTX-Video is a real diffusion-based video generation model with a **built-in keyframe interpolation pipeline** (start frame + end frame + text motion prompt), tested directly and confirmed to produce good results on real ContentForge keyframes. It also supports single-image-to-video, giving flexibility for scenes that don't need two keyframes.

---

## 3. VideoPromptAgent (Groq) — Schema Update

Keep the same 4-scene, 8-keyframe structure from the original plan, but add a **motion prompt** field per scene, since LTX-Video needs a text description of the motion between the two keyframes (this is new — RIFE didn't need this, since it inferred motion purely from pixels).

```json
{
  "video_title": "string",
  "total_duration_seconds": 15,
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 3.75,
      "style_reference": "consistent style descriptor — used for both keyframes in this scene",
      "keyframe_start": { "prompt": "Ideogram prompt for starting frame" },
      "keyframe_end": { "prompt": "Ideogram prompt for ending frame — same subject/setting as start" },
      "motion_prompt": "text description of the camera movement and subject motion between keyframe_start and keyframe_end — e.g. 'Camera slowly pushes in from a wide shot to a close-up. Subject leans in and smiles. Soft natural lighting, smooth realistic camera motion, cinematic handheld feel.'"
    }
  ]
}
```

**Rules for `motion_prompt` generation (Groq):**
- Describe camera movement first (push in, pull back, pan, static), then subject/object motion, then mood/lighting descriptors
- Keep it concrete and filmic — avoid vague terms; describe what visibly changes between the two keyframes
- End with quality descriptors: e.g. "smooth realistic camera motion, no jump cuts, natural human movement"

---

## 4. New Agent: `LTXInterpolationAgent`

Replaces `FrameInterpolationAgent`. Same position in the pipeline (between `ImageGenerationAgent` and `VideoStitchAgent`), same input/output contract at a high level: takes 2 keyframe images per scene, returns a scene video clip.

### 4.1 Setup (one-time, on the local GPU machine)

```bash
git clone https://github.com/Lightricks/LTX-Video.git
cd LTX-Video
pip install -r requirements.txt
# Download pretrained LTX-Video weights per their README/HuggingFace page
# into the model directory their inference script expects
```

Confirm GPU is detected and has enough VRAM (8GB minimum, per LTX-Video's published requirements) before running any real jobs.

### 4.2 Agent responsibilities

For each of the 4 scenes:
1. Take `keyframe_start` image, `keyframe_end` image, and `motion_prompt` text from the scene's data
2. Call LTX-Video's keyframe interpolation pipeline (start frame + end frame + text-conditioned motion) to generate the in-between video for that scene (~3.75 seconds per scene at 24fps)
3. Save the output as `scene_N.mp4` in the working output directory, matching the naming convention `VideoStitchAgent` already expects (same as the old RIFE agent's output naming, so the stitch step needs no changes)

### 4.3 Fallback behavior

Keep the same safety principle as before — a job should never hard-fail:
- If the LTX-Video model fails to load (missing weights, GPU error, etc.) → fall back to a simple moviepy crossfade for that scene, log a clear warning
- If generation succeeds for some scenes but fails for others → only the failed scene falls back to crossfade, the rest use real LTX-Video output

### 4.4 Interface contract (so `VideoStitchAgent` needs no changes)

```
Input:  keyframe_start_path, keyframe_end_path, motion_prompt, duration_seconds, output_path
Output: path to a scene_N.mp4 file (same as old FrameInterpolationAgent's final scene output)
```

Keeping this interface identical to what `VideoStitchAgent` already consumes means the stitching step (hard cuts between scenes, audio, text overlays, branding) requires **zero changes**.

---

## 5. Pipeline Architecture (Updated)

```
User content brief
      ↓
[VideoPromptAgent] (Groq)
      → 4 scenes, 8 keyframe prompts, + motion_prompt per scene (NEW field)
      ↓
[ImageGenerationAgent] (Ideogram)
      → 8 keyframes, consistent style/seed per scene (unchanged)
      ↓
[LTXInterpolationAgent] (NEW — replaces FrameInterpolationAgent/RIFE)
      → generates 4 scene video clips using LTX-Video keyframe interpolation
      ↓
[VideoStitchAgent] (moviepy — unchanged)
      → hard cuts between scenes, audio, text overlays, branding
      → final 15-second MP4
```

---

## 6. Testing Checklist Before Full Wiring

- [ ] Confirm LTX-Video installed and model weights downloaded correctly
- [ ] Run one manual scene test (2 real keyframes + a motion prompt) standalone, outside the full pipeline — confirm output quality before wiring in
- [ ] Confirm output video naming/path matches what `VideoStitchAgent` expects
- [ ] Run one full end-to-end 15-second video generation and review final output
- [ ] Confirm RIFE files are fully removed and no leftover imports break the app on startup

---

## 7. Cost Summary (unchanged from original plan)

| Item | Cost driver |
|---|---|
| Groq call | 1 call (scene/schema generation incl. motion prompts) |
| Ideogram calls | 8 calls (unchanged) |
| LTX-Video | Free — open weights (Apache 2.0), runs on local GPU |
| moviepy | Free (local compute) |

No new paid dependency introduced. LTX-Video replaces RIFE 1:1 in terms of cost (both free/local), but produces real generative motion instead of interpolated blending.
