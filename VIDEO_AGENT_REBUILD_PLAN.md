# ContentForge AI — Video Generation Agent Rebuild Plan
## Groq + Ideogram + RIFE Pipeline (Veo 3.0 Replacement)

**Status:** New build. Existing Veo pipeline is PAUSED, not deleted.
**Owner:** JAANU
**Last updated:** 2026-07-08

---

## 0. Critical Instructions for Agents Building This

1. **DO NOT delete any existing Veo 3.0 video generation code, prompts, or config.**
2. If any existing file conflicts with this new pipeline (same filename, same route, same agent name), **move the old file into a folder named `waste/` at the repo root** (preserve original relative path inside `waste/`, e.g. `waste/agents/video_prompt_agent.py`). Do not overwrite in place.
3. The old Veo pipeline should remain callable/re-enable-able later — treat this as a **parallel new agent path**, not a hard replacement, until explicitly told to remove Veo permanently.
4. If unsure whether a file belongs to the Veo pipeline, **ask before moving it.**

---

## 1. Why This Exists

Google Veo 3.0 dependency has been paused. This pipeline achieves video output using only:
- **Groq (Llama 3.3 70B)** — already integrated, used for all text agents
- **Ideogram** — already integrated, used for image generation
- **RIFE** (Real-Time Intermediate Flow Estimation) — new, open-source, local, free
- **moviepy** — already available, used for stitching

**Goal:** Low cost, high quality, zero new external API dependency.

---

## 2. What Changes vs. Old Veo Pipeline

| Aspect | Old (Veo 3.0) | New (Groq + Ideogram + RIFE) |
|---|---|---|
| Motion source | Native generative video | Interpolated motion between static keyframes |
| External API | Google Veo 3.0 | None (Ideogram + Groq already in use) |
| Cost model | Per-second video generation cost | Per-image cost (Ideogram) + free local compute (RIFE) |
| Video length | Variable | **Fixed: 15 seconds** (v1 constraint) |
| Output style | True generative motion | Cinematic keyframe interpolation + hard cuts (like a high-end motion-graphics video, not raw slideshow) |

---

## 3. Fixed Parameters (v1)

| Parameter | Value |
|---|---|
| Video length | **15 seconds, strict** |
| Frame rate | 24 fps |
| Total output frames | 360 |
| Scenes | 4 (fixed for v1) |
| Ideogram keyframes | **8 total (2 per scene, fixed)** |
| RIFE interpolated frames per scene | ~58 (between each keyframe pair) |
| Cuts between scenes | 3 hard cuts (moviepy, no interpolation across scene boundaries) |

**Why 8 Ideogram calls, fixed:** Keeps cost predictable per video generation, regardless of prompt complexity. Every video = 8 Ideogram generations, no more, no less, for v1.

---

## 4. Pipeline Architecture

```
User content brief
      ↓
[VideoPromptAgent] (Groq / Llama 3.3 70B)
      → outputs: 4-scene breakdown, JSON schema (see Section 5)
      ↓
[ImageGenerationAgent] (Ideogram)
      → generates 8 keyframes (2 per scene)
      → MUST use consistent style/seed/reference across frames within same scene
      ↓
[FrameInterpolationAgent] (RIFE — new agent)
      → interpolates ~58 frames between each scene's 2 keyframes
      → outputs 4 sets of ~60-frame sequences
      ↓
[VideoStitchAgent] (moviepy — existing, modify)
      → hard-cuts between the 4 scene sequences
      → adds audio, text overlays, branding
      → outputs final MP4
```

### New agent required: `FrameInterpolationAgent`
This is the only genuinely new component. Everything else reuses existing Groq/Ideogram/moviepy integration.

---

## 5. VideoPromptAgent Output Schema (Groq)

The Groq prompt must be updated to output **exactly 4 scenes**, each with **exactly 2 keyframe prompts**, in this JSON structure:

```json
{
  "video_title": "string",
  "total_duration_seconds": 15,
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 3.75,
      "style_reference": "consistent style descriptor string — used for both keyframes in this scene",
      "keyframe_start": {
        "prompt": "detailed Ideogram prompt for the starting frame of this scene"
      },
      "keyframe_end": {
        "prompt": "detailed Ideogram prompt for the ending frame — must describe the SAME scene/subject/room as keyframe_start, differing only in camera position, zoom, or minor motion (e.g. camera pushed 20% closer, camera panned right)"
      }
    }
  ]
}
```

**Rules Groq must follow when generating this schema:**
- All 4 scenes together must total exactly 15 seconds (recommend 3.75s each, or vary but must sum to 15).
- `keyframe_start` and `keyframe_end` within a scene must describe the **same subject, same setting, same lighting** — only camera/motion differs. (This is required for RIFE to interpolate cleanly — large visual differences between the two frames will produce a warped morph instead of smooth motion.)
- Different scenes (scene 1 vs scene 2, etc.) CAN differ completely — those become hard cuts, not interpolation targets.
- `style_reference` must be identical for both keyframes in the same scene, and should be reused as the Ideogram style/seed input for consistency.

---

## 6. ImageGenerationAgent Changes

- Modify calls to Ideogram to pass the **same seed and/or style reference** for `keyframe_start` and `keyframe_end` within a scene.
- Output: 8 images total, named/tagged clearly, e.g.:
  - `scene1_frame_start.png`, `scene1_frame_end.png`
  - `scene2_frame_start.png`, `scene2_frame_end.png`
  - ... through scene 4

---

## 7. FrameInterpolationAgent (NEW) — RIFE Integration

**Purpose:** Take each scene's 2 keyframes and generate the in-between motion frames.

**Library:** RIFE (Real-Time Intermediate Flow Estimation) — open source, pip-installable, runs on CPU (slower) or GPU (faster). No per-call cost.

**Input:** 2 images (start, end) + target frame count (~58, to reach ~60 total frames per scene at 24fps × 2.5s, adjust based on actual per-scene duration).

**Output:** Ordered sequence of interpolated frames (PNG or directly assembled into a short video clip per scene).

**Implementation notes for the building agent:**
- Install RIFE via its official repo/pip package; verify compatibility with the Hostinger KVM2 server (CPU-only — expect slower processing, budget for this in queue/job timing, not real-time).
- This step should be its own isolated service/function so it can be swapped or upgraded later (e.g., to FILM or a paid interpolation API) without touching the rest of the pipeline.
- Add error handling: if RIFE fails on a given frame pair (e.g., too much visual difference), fall back to a **simple crossfade** via moviepy rather than failing the whole video generation.

---

## 8. VideoStitchAgent Changes (moviepy)

- Assemble the 4 interpolated scene sequences in order.
- Apply **hard cuts** between scenes (no crossfade across scene boundaries, per Section 5 rules) — unless a specific style calls for a soft transition, which should be a configurable flag, not default.
- Add existing audio/text overlay/branding logic exactly as it works today — no changes needed here beyond the input source.
- Output: final 15-second MP4 at 24fps.

---

## 9. What NOT to Touch

- TwitterPublisherAgent, ResearchAgent, ScriptAgent, HashtagAgent — unaffected, no changes.
- Existing Veo 3.0 code — **paused, not removed.** Move conflicting files to `waste/`, don't delete.
- Supabase schema — only touch if new fields are needed to track which video-generation method (Veo vs. Groq+Ideogram+RIFE) was used per generation record (recommended: add a `video_pipeline` enum/string column — confirm with JAANU before altering schema).

---

## 10. Open Questions to Confirm Before Building

- [ ] Should `video_pipeline` type (veo / groq_ideogram_rife) be stored per generation in Supabase for future toggling?
- [ ] Confirm Hostinger KVM2 has enough CPU/RAM headroom for RIFE processing at expected volume — may need to benchmark one full 15s generation before rollout.
- [ ] Confirm fallback behavior if Ideogram rate-limits mid-generation (8 calls per video) — retry queue vs. fail whole job.

---

## 11. Cost Summary (v1, per video)

| Item | Cost driver |
|---|---|
| Groq call | 1 call (scene/schema generation) — already in existing cost model |
| Ideogram calls | 8 calls — already in existing cost model |
| RIFE | Free (local compute, one-time setup cost only) |
| moviepy | Free (local compute) |

**Net effect:** Removes Veo cost entirely, adds no new paid dependency. Only new cost is server compute time for RIFE, which is negligible compared to any Veo API cost.
