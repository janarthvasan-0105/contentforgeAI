"""
video_prompt_text_rules.py
──────────────────────────
Sanitizer for Veo scene prompts.

Implements Bug 1 fix from debug-missing-text-brand.md:
  The quote-stripping regex previously deleted HERO text and spoken_line
  quotes that were intentionally placed in the prompt. Fix: placeholder-
  protect both hero_text and spoken_line before stripping, then restore.

Also implements Part 1 of veo-text-cast-product.md:
  - HERO text (≤8 words, structured source) → allowed through; injected
    with the exact literal clause format Veo responds best to.
  - SUPPORT text (dense, small, LLM-generated) → still stripped.

Also implements Step 2 of veo-native-dialogue.md:
  - spoken_line protected the same way hero_text is protected.
"""

import re
from typing import Optional


# ── Hero Text Injection ───────────────────────────────────────────────────────

HERO_TEXT_MAX_WORDS = 8   # Part 1, veo-text-cast-product.md


def inject_hero_text(scene_prompt: str, hero_text: Optional[str]) -> str:
    """
    Appends the HERO text clause to scene_prompt using the exact literal
    phrasing that Veo responds to reliably (Part 1, veo-text-cast-product.md).

    hero_text must come from structured fields (brand_name / tagline / cta),
    never from LLM free text, so the string is always deterministic.
    """
    if not hero_text or not hero_text.strip():
        return scene_prompt
    hero_text = hero_text.strip()
    word_count = len(hero_text.split())
    if word_count > HERO_TEXT_MAX_WORDS:
        # Truncate to the first HERO_TEXT_MAX_WORDS words — support text
        # goes through TextOverlayAgent, not here.
        hero_text = " ".join(hero_text.split()[:HERO_TEXT_MAX_WORDS])
    scene_prompt += (
        f' Large bold text overlay appears reading exactly: "{hero_text}"'
        f' in clean sans-serif font, high contrast against the background.'
    )
    return scene_prompt


# ── Dialogue Injection ────────────────────────────────────────────────────────

def inject_spoken_line(scene_prompt: str, spoken_line: Optional[str], speaker_present: bool) -> str:
    """
    Appends the dialogue instruction to scene_prompt for speaking scenes.

    Uses the directive phrasing from debug-generic-dialogue.md §3 — more
    explicit than "speaks naturally", giving Veo less room to improvise.
    (Step 2, veo-native-dialogue.md)
    """
    if not speaker_present or not spoken_line or not spoken_line.strip():
        return scene_prompt
    scene_prompt += (
        f' The person looks directly at camera and clearly states the'
        f' following line word-for-word: "{spoken_line.strip()}"'
    )
    return scene_prompt


# ── Sanitizer (Bug 1 fix, debug-missing-text-brand.md) ───────────────────────

def sanitize_scene_prompt(
    scene_prompt: str,
    hero_text: Optional[str] = None,
    spoken_line: Optional[str] = None,
) -> str:
    """
    Sanitizes a scene prompt to remove support-tier text instructions while
    preserving intentional HERO text and spoken_line quotes.

    Protection order:
      1. Replace hero_text / spoken_line quotes with placeholders.
      2. Strip any remaining quoted strings 2-60 chars (support text).
      3. Blur sign/screen/text descriptions (LLM hallucinated support text).
      4. Restore placeholders back to their original quoted values.

    (Bug 1 fix from debug-missing-text-brand.md; extended for spoken_line
     per Step 2 of veo-native-dialogue.md)
    """
    cleaned = scene_prompt
    protected: dict[str, str] = {}

    for i, text in enumerate([hero_text, spoken_line]):
        if text and text.strip():
            key = f"\x00PROTECT{i}\x00"
            protected[key] = text.strip()
            cleaned = cleaned.replace(f'"{text.strip()}"', key)

    # Strip support-tier quoted strings (2-60 chars)
    cleaned = re.sub(r"['\"][^'\"]{2,60}['\"]", "", cleaned)

    # Blur LLM-hallucinated sign/screen/text descriptions
    cleaned = re.sub(
        r"\b(sign|signage|billboard|screen|text)\s+(?:that\s+)?(?:reads?|says?|displaying|showing)\s+[^,.;]+",
        r"a blurred \1",
        cleaned,
        flags=re.IGNORECASE,
    )

    # Restore protected placeholders
    for key, text in protected.items():
        cleaned = cleaned.replace(key, f'"{text}"')

    return re.sub(r"\s{2,}", " ", cleaned).strip(" ,.")
