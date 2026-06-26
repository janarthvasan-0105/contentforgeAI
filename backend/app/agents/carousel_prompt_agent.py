import json
from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage


async def carousel_prompt_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates 3 detailed advertisement poster prompts for carousel slides.
    Each slide has its own scene, character placement, and text layout.
    Narrative arc: Slide 1 Hook → Slide 2 Value → Slide 3 CTA.
    """
    post_type = state.get("post_type", "single_post")

    if post_type != "carousel":
        state["carousel_image_prompts"] = []
        return state

    brand_name = state.get("brand_name", "Brand")
    platform = state.get("platform", "instagram").lower()
    topic = state.get("topic", "")
    target_audience = state.get("target_audience", state.get("audience", ""))
    image_style = state.get("image_style", "realistic")
    tone = state.get("tone", "educational")
    brand_colors = state.get("brand_colors", ["#0F766E", "#FFFFFF"])
    cta_goal = state.get("cta_goal", "downloads")
    app_context = state.get("app_context", {})
    post_scripts = state.get("post_scripts", [])
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str = f"\nUSER DIRECTIVES / CRITICAL STYLE SUGGESTIONS (Mandatory to implement):\n{user_suggestion}\n" if user_suggestion else ""

    # App context injection
    app_context_str = ""
    if app_context:
        features = app_context.get("key_features", [])
        app_context_str = f"""
App/Product details:
- Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key features: {', '.join(features[:3]) if features else ''}
- USP: {app_context.get('unique_selling_points', [''])[0] if app_context.get('unique_selling_points') else ''}
"""

    # Build slide content from post_scripts
    slides_content = ""
    for slide in post_scripts:
        slides_content += f"""
SLIDE {slide.get('slide_number')} — {slide.get('role', '').upper()}:
  Headline: "{slide.get('headline', '')}"
  Body: "{slide.get('body', '')}"
  CTA: "{slide.get('cta', '')}"
"""

    # ── Brand Identity Injection ──────────────────────────────────────
    brand_identity = state.get("brand_identity", {})

    brand_identity_str = ""
    if brand_identity:
        parts = []
        if brand_identity.get("primary_color"):
            parts.append(f"Primary color: {brand_identity['primary_color']}")
        if brand_identity.get("button_color"):
            parts.append(f"CTA button color: {brand_identity['button_color']}")
        if brand_identity.get("font_family"):
            parts.append(f"Brand font: {brand_identity['font_family']}")
        if brand_identity.get("tagline"):
            parts.append(f"Brand tagline: '{brand_identity['tagline']}'")
        if brand_identity.get("logo_compositing"):
            parts.append(
                "Real brand logo will be composited top-left after generation. "
                "Keep top-left corner clean. Do NOT include brand name text — "
                "real logo will be placed automatically on all 3 slides."
            )
        brand_identity_str = "\nBRAND IDENTITY:\n" + "\n".join(parts)

    system_instruction = """You are a world-class art director specializing in
carousel advertisement design and AI image prompt engineering.
Each carousel slide must:
- Have a visually distinct scene that differs from other slides
- Follow a narrative arc: Slide 1 grabs attention, Slide 2 delivers value, Slide 3 drives action
- Be detailed enough for AI to generate without ambiguity
- Have all text elements clearly specified with exact wording and placement
- Feature Indian people/context appropriate to the target audience"""

    prompt = f"""
You are a world-class art director specializing in carousel advertisement
design and AI image prompt engineering for tools like Google Imagen.

Here is an EXAMPLE of the EXACT quality, format, and detail level required
for a 3-slide carousel. Study the narrative arc, scene variety, character
continuity, and text placement for each slide:

=== EXAMPLE OUTPUT — FORMAT REFERENCE ONLY, DO NOT COPY CONTENT ===

SLIDE 1 OF 3 — HOOK:
A dramatic, attention-grabbing advertisement poster — Slide 1 of 3 —
for "RentIt", a property platform for modern India.

Background scene: A crowded, chaotic Indian street at midday — auto
rickshaws, people rushing, a tired-looking Indian couple in their late
20s standing on a pavement surrounded by luggage, both looking stressed
and overwhelmed. Hot harsh midday sunlight. Slightly desaturated color
tone to emphasize frustration. Camera angle: eye-level medium shot
centered on the couple.

Character placement: Indian couple — woman in her late 20s in a
light blue kurta looking at her phone with a frown, man beside her
in a white shirt looking around anxiously. Both in lower-center of
frame, luggage at their feet, busy street behind them.

The poster must render all text accurately and sharply:
- Giant bold white headline top-center: "Still Searching for a Home?"
- Supporting line below in medium white: "Hundreds of people waste weeks looking. You don't have to."
- Brand name top-left in teal: "RentIt"

Layout: Problem-focused. Dark semi-transparent overlay on top half.
Text in upper portion, characters in lower half. High contrast.
Color palette: Desaturated street scene, teal brand accent, white text
with 3px black drop shadow.
Typography: Heavy bold condensed sans-serif headline, regular weight body.
Quality: Ultra HD, 1080x1080, sharp text, no blur, no misspellings.

---

SLIDE 2 OF 3 — VALUE:
A bright, solution-focused advertisement poster — Slide 2 of 3 —
for "RentIt".

Background scene: Interior of a modern bright apartment — white walls,
large windows with soft afternoon light flooding in, minimal furniture,
clean wooden floors. The same Indian couple from Slide 1, now relaxed
and smiling, standing in the center of the empty apartment looking
around with relief and happiness. Warm golden interior light.
Camera angle: wide interior shot showing the full space.

Character placement: Same couple — woman now smiling and gesturing
at the space, man on phone looking pleased. Both center-frame.
Apartment interior fills background. Large windows visible behind them.

The poster must render all text accurately and sharply:
- Large bold white headline top: "1000+ Verified Properties. Zero Brokers."
- Supporting line: "Browse real listings, connect directly with owners on RentIt."
- Brand name top-left in teal: "RentIt"
- Feature tags in small rounded pills center-bottom: "✓ Verified" "✓ No Brokerage" "✓ Instant Connect"

Layout: Solution-focused. Bright warm tone contrast to Slide 1.
Text top, characters center, feature pills bottom.
Color palette: Warm whites and ambers, teal accents, white text.
Typography: Bold headline, regular body, small rounded pill tags.
Quality: Ultra HD, 1080x1080, sharp text, no blur.

---

SLIDE 3 OF 3 — CTA:
An aspirational, action-driving advertisement poster — Slide 3 of 3 —
for "RentIt".

Background scene: The same couple now standing at the entrance of
their new apartment building at golden hour — warm amber sunlight,
lush greenery around a modern residential complex, clear blue sky.
The man holds up a house key, both beaming with joy. Celebratory
and aspirational mood. Camera angle: low angle looking slightly up
at them, building visible behind them.

Character placement: Couple in lower-center, key held up by man
in right hand, woman's arm around his shoulder. Both facing camera,
full smiles. Modern apartment building behind them, soft bokeh on
background.

The poster must render all text accurately and sharply:
- Bold white headline top: "Your New Home is Waiting."
- Supporting line: "Join 30 lakh+ happy families who found their home on RentIt."
- Brand name top-left in teal: "RentIt"
- CTA button bottom-center in solid teal rectangle white text: "Download Free — iOS & Android"
- Bottom fine print white small: "Verified listings across India"

Layout: Celebratory. Warm tone. Strong CTA button bottom-center.
Text top, characters lower-center, CTA bottom.
Color palette: Golden hour scene, teal CTA button, white text.
Typography: Bold headline, regular body, rounded rectangle CTA.
Quality: Ultra HD, 1080x1080, sharp text, no blur.

=== END EXAMPLE ===

Now generate 3 carousel slide prompts at EXACTLY this quality level
using the details below. Follow the same narrative arc:
Slide 1 = Hook (problem/attention), Slide 2 = Value (solution/features),
Slide 3 = CTA (resolution/action).

BRAND: {brand_name}
TOPIC: {topic}
PLATFORM: {platform.upper()} — 1080x1080 square each slide
TARGET AUDIENCE: {target_audience}
IMAGE STYLE: {image_style}, photorealistic, ultra HD
TONE: {tone}
BRAND COLORS: {', '.join(brand_colors)}
CTA GOAL: {cta_goal}
{app_context_str}
{brand_identity_str}
{suggestion_str}

SLIDE SCRIPTS — use these EXACTLY as poster text for each slide:
{slides_content}

STRICT RULES — violating any of these is unacceptable:
1. Each slide must have a DIFFERENT scene — no repeating locations
2. Characters must be the SAME Indian people across all 3 slides
   for visual narrative continuity — matching {target_audience}
3. Slide 1 must feel like a PROBLEM — slightly desaturated, stressful tone
4. Slide 2 must feel like a SOLUTION — warm, bright, positive tone
5. Slide 3 must feel ASPIRATIONAL — golden hour, celebratory, resolved tone
6. Every slide must specify: scene location, time of day, lighting,
   camera angle, character position, clothing, expression, action
7. Every text element must list: size, position, exact wording, font style,
   color, contrast treatment — EXACT wording from slide scripts only
   CRITICAL COLOR RULE: You MUST ensure text is perfectly readable! If the background is light, text MUST be DARK (black or dark brand color). If the background is dark, text MUST be WHITE. NEVER put white text on a light background. Always specify a solid contrast panel or heavy dark overlay behind text.
8. Brand name "{brand_name}" must appear on ALL 3 slides
9. CTA button only on Slide 3
10. Return ONLY a valid JSON array of exactly 3 strings
    — no explanation, no markdown fences, no extra text
11. DO NOT copy the example content — generate fresh for {brand_name}
"""

    try:
        response_text = invoke_with_fallback([HumanMessage(content=prompt)])
        text = response_text.strip().replace("```json", "").replace("```", "").strip()
        prompts = json.loads(text)

        if not isinstance(prompts, list) or len(prompts) != 3:
            raise ValueError(f"Expected 3 prompts, got {len(prompts) if isinstance(prompts, list) else type(prompts)}")

        state["carousel_image_prompts"] = prompts
        # Also set image_prompts for image_generation_agent compatibility
        state["image_prompts"] = prompts

    except Exception as e:
        state["errors"] = state.get("errors", []) + [f"Carousel prompt agent failed: {str(e)}"]
        state["carousel_image_prompts"] = []
        state["image_prompts"] = []

    return state
