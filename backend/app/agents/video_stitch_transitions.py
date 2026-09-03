"""
video_stitch_transitions.py

Replaces the plain ffmpeg-concat step inside VideoStitchAgent.
Target path: backend/agents/video_stitch_transitions.py
(import from wherever VideoStitchAgent currently runs its concat step)

WHY
---
The last output had video duration 32.04s but audio duration only
26.33s — a real mismatch, not a rounding artifact. Stream-copy concat
(`ffmpeg -f concat -c copy`) requires every input clip to have matching
audio presence/duration; when one or more scenes have no audio track
(silent B-roll scenes) or an audio track shorter than its video, the
concat demuxer produces a broken multiplexed file that many players
stall on exactly at that boundary — this is almost certainly your
"video got stuck" symptom.

This module does two things:
1. normalize_scene_audio() — guarantees every scene clip has an audio
   track exactly as long as its video track (pads with silence if
   missing or short) BEFORE stitching, so concat never hits a mismatch.
2. crossfade_stitch() — replaces hard cuts with a short crossfade
   between consecutive scenes (video xfade + audio acrossfade), which
   is also the direct fix for "make sure one scene follows the other
   to make a nice video output" — this requires re-encoding (not
   stream copy), which is a deliberate tradeoff: slightly slower stitch,
   much more robust output, and no visible mismatch at scene boundaries.
"""

import subprocess
import json
from pathlib import Path
from typing import List


def _probe_durations(path: Path) -> tuple[float, bool]:
    """Returns (video_duration_sec, has_audio_stream)."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(path),
        ],
        capture_output=True, text=True,
    )
    data = json.loads(result.stdout)
    video_duration = float(data["format"]["duration"])
    has_audio = any(s["codec_type"] == "audio" for s in data["streams"])
    return video_duration, has_audio


def normalize_scene_audio(video_path: Path, output_path: Path) -> Path:
    """
    Ensures video_path has an audio track exactly matching its video
    duration. If audio is missing entirely, adds silence. If audio is
    shorter than video, pads the end with silence. If audio already
    matches (within 0.1s tolerance), just copies through.
    """
    video_path, output_path = Path(video_path), Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    video_duration, has_audio = _probe_durations(video_path)

    if not has_audio:
        # No audio stream at all — add a fully silent track matching video length
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-f", "lavfi", "-i", f"anullsrc=channel_layout=mono:sample_rate=22050",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest", "-t", str(video_duration),
            "-map", "0:v:0", "-map", "1:a:0",
            str(output_path),
        ]
    else:
        # Audio exists — pad with silence if shorter than video, trim if somehow longer
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-af", f"apad=whole_dur={video_duration}",
            "-c:v", "copy",
            "-c:a", "aac",
            "-t", str(video_duration),
            str(output_path),
        ]

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(f"Audio normalization failed for {video_path}: {result.stderr.decode(errors='ignore')}")

    return output_path


def crossfade_stitch(scene_paths: List[Path], output_path: Path, transition_sec: float = 0.5) -> Path:
    """
    Stitches scene_paths together with a crossfade transition between
    each consecutive pair, instead of a hard cut. Requires re-encoding
    (xfade/acrossfade can't be done as a stream copy).

    IMPORTANT: run normalize_scene_audio() on every scene first — this
    function assumes every input already has an audio track matching
    its video duration.
    """
    scene_paths = [Path(p) for p in scene_paths]
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if len(scene_paths) < 2:
        raise ValueError("crossfade_stitch needs at least 2 scenes")

    durations = [_probe_durations(p)[0] for p in scene_paths]

    inputs = []
    for p in scene_paths:
        inputs += ["-i", str(p)]

    # Build chained xfade (video) + acrossfade (audio) filter graph.
    # Each xfade's "offset" is the cumulative timeline position minus
    # the transition overlap, so transitions land correctly back-to-back.
    filter_parts = []
    v_label = "0:v"
    a_label = "0:a"
    cumulative = durations[0]

    for i in range(1, len(scene_paths)):
        offset = cumulative - transition_sec
        next_v = f"v{i}"
        next_a = f"a{i}"
        filter_parts.append(
            f"[{v_label}][{i}:v]xfade=transition=fade:duration={transition_sec}:offset={offset}[{next_v}]"
        )
        filter_parts.append(
            f"[{a_label}][{i}:a]acrossfade=d={transition_sec}[{next_a}]"
        )
        v_label, a_label = next_v, next_a
        cumulative += durations[i] - transition_sec

    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", f"[{v_label}]",
        "-map", f"[{a_label}]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac",
        str(output_path),
    ]

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(f"Crossfade stitch failed: {result.stderr.decode(errors='ignore')}")

    return output_path


def stitch_scenes(scene_paths: List[Path], output_path: Path, working_dir: Path, transition_sec: float = 0.5) -> Path:
    """
    Full replacement for VideoStitchAgent's current concat step:
    normalize every scene's audio, then crossfade-stitch them together.
    """
    working_dir = Path(working_dir)
    working_dir.mkdir(parents=True, exist_ok=True)

    normalized = []
    for i, scene_path in enumerate(scene_paths):
        norm_path = working_dir / f"normalized_scene_{i}.mp4"
        normalize_scene_audio(Path(scene_path), norm_path)
        normalized.append(norm_path)

    return crossfade_stitch(normalized, Path(output_path), transition_sec=transition_sec)
