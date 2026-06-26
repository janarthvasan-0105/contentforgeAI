# app/agents/format_picker_agent.py
"""
Picks the next post format based on:
  - detected_field       (from FieldDetectionAgent)
  - platform             (from state)
  - format_history       (last 2 formats used by this brand)

Input:  state["detected_field"], state["platform"], state["format_history"]
Output: state["selected_format"], state["format_metadata"]
"""

from app.models.state import ContentForgeState
from app.utils.format_config import (
    FORMAT_POOL,
    FIELD_FORMAT_PRIORITY,
    DEFAULT_FORMAT_PRIORITY,
    PLATFORM_FORMAT_WEIGHTS
)


def _pick_format(
    detected_field: str,
    platform: str,
    format_history: list[str],
) -> str:
    # Get priority list for this field
    priority = FIELD_FORMAT_PRIORITY.get(detected_field, DEFAULT_FORMAT_PRIORITY)

    # Get platform preferred formats
    platform_preferred = PLATFORM_FORMAT_WEIGHTS.get(platform.lower(), [])

    # Filter out last 2 used formats to force variety
    history_set = set(format_history[-2:]) if format_history else set()

    # Build candidate list: platform-preferred first, then rest of priority
    candidates = []
    for fmt in platform_preferred:
        if fmt in priority and fmt not in history_set:
            candidates.append(fmt)
    for fmt in priority:
        if fmt not in candidates and fmt not in history_set:
            candidates.append(fmt)

    # If all formats are in history (very rare), reset and pick first
    if not candidates:
        candidates = priority

    selected = candidates[0]
    return selected


async def format_picker_agent(state: ContentForgeState) -> ContentForgeState:
    detected_field = state.get("detected_field", "saas")
    platform       = state.get("platform", "instagram")
    format_history = state.get("format_history", [])

    selected = _pick_format(detected_field, platform, format_history)
    metadata = FORMAT_POOL.get(selected, {})

    state["selected_format"]  = selected
    state["format_metadata"]  = metadata
    state["format_history"]   = (format_history + [selected])[-5:]  # keep last 5

    print(f"[FormatPicker] Field: {detected_field} | Platform: {platform}")
    print(f"[FormatPicker] Selected format: {selected}")
    print(f"[FormatPicker] History: {state['format_history']}")
    return state
