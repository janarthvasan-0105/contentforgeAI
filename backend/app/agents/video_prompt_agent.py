"""
video_prompt_agent.py
─────────────────────
Generates a structured, Veo-optimised prompt for a single 8-second cinematic
video advertisement.

Implements all fixes from:
  - docs/veo3-prompt-architecture-fix.md   (§1–§5)
  - docs/veo3-multiscene-context-bleeding-fix.md (Fix 3, Fix 4)

Pipeline:
  1. Ask Groq to produce 6 structured scene fields as JSON.
  2. Validate: single action per field (Fix §3).
  3. Inject domain shot-bank values for any missing framing/camera fields (Fix §5).
  4. Route overlay text: ≤4 words → embed in Veo prompt; longer → FFmpeg only (Fix 4).
  5. Strip negations from all positive-prompt fields (Fix §4).
  6. Assemble final Veo prompt deterministically via build_scene_prompt() (Fix §2).
  7. Embed literal quoted dialogue via build_audio_block() (Fix §1).
  8. Write state["video_prompt"] (the final string sent to Veo).
"""

import json
import re
import random
from typing import Optional

from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage
from app.utils.suggestion_utils import build_suggestion_constraint
from app.agents.video_prompt_text_rules import (
    inject_hero_text,
    inject_spoken_line,
    sanitize_scene_prompt,
)


# ── §5 Domain Shot Banks ──────────────────────────────────────────────────────

DOMAIN_SHOT_BANKS: dict[str, dict[str, list[str]]] = {
    "rental": {
        "framing": [
            "wide-angle 24mm establishing shot, deep depth of field",
            "cinematic medium close-up, 85mm lens, shallow DOF",
            "slow tracking shot through the space, 35mm lens",
            "static locked-off shot of the doorway, 50mm",
        ],
        "lighting": [
            "soft diffused morning light, cool white balance",
            "warm golden hour backlight, amber tones",
            "high-contrast late afternoon sunlight, hard shadows",
        ],
        "camera_move": [
            "slow dolly-in toward subject",
            "handheld with subtle organic shake",
            "crane jib descending slowly",
            "static locked-off, no camera movement",
        ],
    },
    "dating": {
        "framing": [
            "cinematic medium close-up, 85mm lens, shallow DOF",
            "two-shot over-the-shoulder, 50mm",
            "wide-angle 24mm lifestyle shot",
        ],
        "lighting": [
            "golden hour backlight, warm bokeh",
            "warm tungsten café lighting",
            "soft diffused window light",
        ],
        "camera_move": [
            "slow tracking shot, smooth",
            "static locked-off shot",
            "gentle push-in toward subject",
        ],
    },
    "education": {
        "framing": [
            "medium shot, eye-level, 50mm lens",
            "close-up on hands and materials, 85mm",
            "wide establishing shot, 24mm",
        ],
        "lighting": [
            "soft diffused daylight, high dynamic range",
            "clean studio lighting, neutral white",
            "warm desk lamp accent, ambient fill",
        ],
        "camera_move": [
            "static locked-off shot",
            "subtle rack focus, pull to subject",
            "slow arc around subject",
        ],
    },
    "finance": {
        "framing": [
            "medium close-up, 85mm, shallow DOF",
            "wide-angle 24mm establishing shot",
            "over-the-shoulder screen shot, 50mm",
        ],
        "lighting": [
            "clean office lighting, neutral white",
            "warm home ambient lighting",
            "soft window light, minimal shadows",
        ],
        "camera_move": [
            "static locked-off shot",
            "slow dolly-in",
            "subtle handheld float",
        ],
    },
    "general": {
        "framing": [
            "cinematic medium close-up, 85mm lens, shallow DOF",
            "wide-angle 24mm establishing shot",
            "medium shot, eye-level, 50mm lens",
            "slow tracking lifestyle shot, 35mm",
        ],
        "lighting": [
            "soft diffused natural daylight",
            "warm golden hour backlight",
            "clean neutral studio lighting",
        ],
        "camera_move": [
            "slow dolly-in toward subject",
            "static locked-off shot",
            "handheld with subtle organic shake",
            "gentle arc around subject",
        ],
    },
}


def _get_domain(state: ContentForgeState) -> str:
    for key in DOMAIN_SHOT_BANKS:
        if key in state.get("detected_field", "").lower():
            return key
    for key in DOMAIN_SHOT_BANKS:
        if key in state.get("topic", "").lower():
            return key
    return "general"


def _pick_unused(domain: str, category: str, used: set) -> str:
    bank = DOMAIN_SHOT_BANKS.get(domain, DOMAIN_SHOT_BANKS["general"])
    options = [o for o in bank[category] if o not in used]
    choice = random.choice(options or bank[category])
    used.add(choice)
    return choice


# ── §1 Literal Dialogue Block ─────────────────────────────────────────────────

def build_audio_block(sfx: str, dialogue_line: Optional[str]) -> str:
    """
    Dialogue must be the EXACT ad-copy string — never reworded by Groq.
    (Fix §1 from veo3-prompt-architecture-fix.md)
    """
    audio = f"Audio: {sfx}."
    if dialogue_line:
        audio += f' Dialogue: "{dialogue_line}"'
    return audio


# ── §3 Single-Action Guard ────────────────────────────────────────────────────

MULTI_ACTION_PATTERN = re.compile(r"\b(then|after that|next,)\b", re.IGNORECASE)


def validate_single_action(action: str) -> bool:
    """Returns False if action contains multi-step sequences (Fix §3)."""
    return not MULTI_ACTION_PATTERN.search(action) and action.count(",") <= 1


def _trim_to_single_action(action: str) -> str:
    """Truncate to the first action clause."""
    return re.split(r",\s*|\bthen\b", action, maxsplit=1, flags=re.IGNORECASE)[0].strip()


# ── §4 Negation Stripping ─────────────────────────────────────────────────────

_NEGATION_PATTERNS = [r"\bno\s+\w+", r"\bwithout\s+\w+", r"\bavoid\s+\w+"]


def strip_negations(prompt: str) -> str:
    """Remove negative phrases from positive prompt fields (Fix §4)."""
    for pat in _NEGATION_PATTERNS:
        prompt = re.sub(pat, "", prompt, flags=re.IGNORECASE)
    return re.sub(r"\s{2,}", " ", prompt).strip()


# ── §2 6-Part Scene Prompt Assembler (with hero text + dialogue injection) ─────

def build_scene_prompt(
    scene: dict,
    hero_text: Optional[str] = None,
    spoken_line: Optional[str] = None,
    speaker_present: bool = False,
) -> str:
    """
    Deterministically assembles the final Veo prompt from 6 structured fields,
    then appends hero text and dialogue clauses, then sanitizes.

    Order:
      Framing → Subject → Action → Environment → Lighting → Camera Move
      → Hero text injection (Part 1, veo-text-cast-product.md)
      → Dialogue injection (Step 2, veo-native-dialogue.md)
      → Sanitize (Bug 1 fix, debug-missing-text-brand.md) — LAST
      → Audio block
    """
    parts = [
        scene.get("framing", ""),
        scene.get("subject", ""),
        scene.get("action", ""),
        scene.get("environment", ""),
        scene.get("lighting", ""),
        scene.get("camera_move", ""),
    ]
    prompt = ", ".join(strip_negations(p) for p in parts if p)

    # Append hero text clause (exact literal string, Veo-native)
    prompt = inject_hero_text(prompt, hero_text)

    # Append dialogue instruction with directive phrasing
    prompt = inject_spoken_line(prompt, spoken_line, speaker_present)

    # Sanitize AFTER injections so the sanitizer protects both quotes
    prompt = sanitize_scene_prompt(prompt, hero_text=hero_text, spoken_line=spoken_line)

    # Append audio block (SFX + dialogue metadata for logging)
    prompt += "\n" + build_audio_block(
        scene.get("sfx", "ambient background music"),
        spoken_line if speaker_present else scene.get("dialogue_line"),
    )
    return prompt


# ── Fix 4 (context-bleeding doc): Overlay Text Routing ───────────────────────

HERO_TEXT_MAX_WORDS = 4


def route_overlay_text(overlay_text: str) -> tuple[Optional[str], Optional[str]]:
    """
    Returns (veo_literal_text, post_production_text).
    ≤4 words → safe to embed in Veo prompt as literal on-screen text.
    Longer   → FFmpeg / TextOverlayAgent only; never in the Veo prompt.
    (Fix 4 from veo3-multiscene-context-bleeding-fix.md)
    """
    if not overlay_text or not overlay_text.strip():
        return None, None
    words = overlay_text.strip().split()
    if len(words) <= HERO_TEXT_MAX_WORDS:
        return overlay_text.strip(), None
    return None, overlay_text.strip()


# ── Main Agent ────────────────────────────────────────────────────────────────

async def video_prompt_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates a single structured Veo prompt for an 8-second video ad.

    Output:
        state["video_prompt"]       — final string sent to Veo API
        state["video_post_overlays"] — list of overlay dicts for FFmpeg post-production
    """
    brand_name      = state.get("brand_name", "Brand")
    platform        = state.get("platform", "instagram").lower()
    video_script    = state.get("video_script", {})
    app_context     = state.get("app_context", {})
    topic           = state.get("topic", "")
    target_audience = state.get("target_audience", state.get("audience", ""))
    tone            = state.get("tone", "educational")
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str  = build_suggestion_constraint(user_suggestion)
    domain          = _get_domain(state)
    product_image_url = state.get("product_image_url")  # Part 3, veo-text-cast-product.md

    # Brand identity — source of hero_text (structured, not LLM-generated)
    brand_identity  = state.get("brand_identity", {})
    tagline         = brand_identity.get("tagline", "") if brand_identity else ""
    cta_text_raw    = video_script.get("cta", "")

    # Hero text: brand_name + tagline (≤8 words, from structured fields — Part 1)
    if tagline:
        hero_text = f"{brand_name} — {tagline}"
    else:
        hero_text = brand_name

    # Per-scene dialogue from ScriptAgent (Step 1, veo-native-dialogue.md)
    video_script_scenes = state.get("video_script_scenes", [])
    # Pick the first speaking scene's spoken_line as the primary dialogue for this single-scene video
    first_speaking_scene = next(
        (s for s in video_script_scenes if s.get("speaker_present")), None
    )
    spoken_line     = first_speaking_scene.get("spoken_line") if first_speaking_scene else None
    speaker_present = bool(first_speaking_scene)

    hook_text   = video_script.get("hook", "")
    value_text  = video_script.get("value", "")
    cta_text    = video_script.get("cta", "")
    full_script = video_script.get("full_script", "")

    # Build context strings
    app_context_str = ""
    if app_context:
        features = app_context.get("key_features", [])
        app_context_str = f"""
App/Product Details:
- App Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key features: {', '.join(features[:3]) if features else 'main features'}
- USP: {app_context.get('unique_selling_points', [''])[0] if app_context.get('unique_selling_points') else ''}
"""

    brand_identity_str = ""
    if brand_identity and brand_identity.get("brand_tone_words"):
        brand_identity_str = f"\nBRAND TONE: {', '.join(brand_identity['brand_tone_words'])}"

    # ── Ask Groq to produce the 6 structured fields ───────────────────────────
    # Product image mode: describe motion/context only, not what the product looks like
    product_anchor_note = ""
    if product_image_url:
        product_anchor_note = (
            "\nPRODUCT IMAGE MODE: A product image is provided as the anchor frame. "
            "Describe ONLY camera movement, lighting changes, and contextual environment around the product. "
            "Do NOT re-describe the product's appearance — the image already anchors that."
        )

    groq_prompt = f"""
You are an expert video director designing an 8-second cinematic ad for Google Veo (a text-to-video AI model).

BRAND: {brand_name}
TOPIC: {topic}
PLATFORM: {platform.upper()}
TARGET AUDIENCE: {target_audience}
TONE: {tone}
AD SCRIPT:
  Hook:  {hook_text}
  Value: {value_text}
  CTA:   {cta_text}
  Full:  {full_script}
{app_context_str}
{brand_identity_str}
{suggestion_str}
{product_anchor_note}

Design ONE cinematic 8-second scene. Output EXACTLY these 6 structured fields as JSON.
Do NOT write prose. Each field must be a concise, literal descriptor:

- framing: exact shot type and lens (e.g. "Cinematic medium close-up, 85mm lens, shallow DOF")
- subject: exact description — age, ethnicity, clothing, identity. Indian person matching target audience.
- action: ONE single physical action using exactly one active verb. NO sequences, NO "then", NO "and then".
- environment: foreground and background in one sentence
- lighting: light source, color temperature, grade
- camera_move: exact movement vector and speed

Also output:
- sfx: ambient sound bed (e.g. "soft upbeat music, city ambient sounds")
- dialogue_line: leave null — dialogue is handled separately
- overlay_text: on-screen text for the video (brand name or short CTA ≤4 words), or null

STRICT RULES:
1. action field: one verb + object ONLY. Never "walks in, sits down". Never use "then".
2. Do NOT include negations ("no blur", "avoid X", "without Y") in any field.
3. overlay_text must be ≤4 words MAX if provided.

Return ONLY valid JSON — no markdown, no explanation:
{{
  "framing": "...",
  "subject": "...",
  "action": "...",
  "environment": "...",
  "lighting": "...",
  "camera_move": "...",
  "sfx": "...",
  "dialogue_line": null,
  "overlay_text": "short text or null"
}}
"""

    try:
        raw = invoke_with_fallback([HumanMessage(content=groq_prompt)], quality=True)

        # Strip markdown fences
        text = raw.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        scene = json.loads(text.strip())

        # ── §3: Single-action guard ───────────────────────────────────────────
        action = scene.get("action", "")
        if not validate_single_action(action):
            print(f"[VideoPrompt] Multi-action detected — trimming: '{action}'")
            scene["action"] = _trim_to_single_action(action)

        # ── §5: Fill missing framing/camera from domain shot banks ─────────────
        used_framing: set = set()
        used_cam:     set = set()

        if not scene.get("framing"):
            scene["framing"] = _pick_unused(domain, "framing", used_framing)
        if not scene.get("lighting"):
            scene["lighting"] = _pick_unused(domain, "lighting", set())
        if not scene.get("camera_move"):
            scene["camera_move"] = _pick_unused(domain, "camera_move", used_cam)

        # ── Fix 4: Route overlay text ────────────────────────────────────
        veo_text, post_text = route_overlay_text(scene.get("overlay_text") or "")
        scene["veo_overlay_text"]  = veo_text
        scene["post_overlay_text"] = post_text

        # ── Diagnostic log 1 (debug-generic-dialogue.md §1) ─────────────
        # Confirm spoken_line from ScriptAgent is present before building prompt.
        print(f"[VideoPrompt] spoken_line from ScriptAgent: {repr(spoken_line)}")
        print(f"[VideoPrompt] speaker_present: {speaker_present}")
        audio_block = build_audio_block(scene.get("sfx", ""), spoken_line if speaker_present else None)
        print(f"[VideoPrompt] Audio block: {audio_block}")

        # ── §2: Assemble final Veo prompt (hero text + dialogue + sanitize) ──
        veo_prompt = build_scene_prompt(
            scene,
            hero_text=hero_text,
            spoken_line=spoken_line,
            speaker_present=speaker_present,
        )

        print(f"[VideoPrompt] Final Veo prompt ({len(veo_prompt)} chars):")
        print(f"[VideoPrompt] {veo_prompt[:300]}...")

        # Build post-production overlay schedule for video_overlay_agent
        post_overlays = []
        if post_text:
            post_overlays.append({"text": post_text, "start_sec": 4.5, "end_sec": 7.5})

        state["video_prompt"]         = veo_prompt
        state["video_scene_data"]     = {**scene, "spoken_line": spoken_line, "speaker_present": speaker_present, "hero_text": hero_text}
        state["video_post_overlays"]  = post_overlays
        state["video_scenes_schema"]  = {}              # clear old keyframe schema
        state["product_image_url"]    = product_image_url  # passed through to video_generation_agent

    except Exception as e:
        print(f"[VideoPrompt] Error: {e}")
        state["errors"]              = state.get("errors", []) + [f"Video prompt agent failed: {str(e)}"]
        state["video_prompt"]        = ""
        state["video_scene_data"]    = {}
        state["video_post_overlays"] = []

    return state
