from app.models.state import ContentState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage


async def image_prompt_agent(state: ContentState) -> ContentState:
    """
    Generates a detailed advertisement poster prompt for Gemini Imagen.
    Uses compositional deconstruction format for precise image generation.
    Only runs for single_post. Carousel handled by carousel_prompt_agent.
    """
    post_type = state.get("post_type", "single_post")

    if post_type == "carousel":
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
    visual_concepts = state.get("visual_concepts", [])
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str = f"\nUSER DIRECTIVES / CRITICAL STYLE SUGGESTIONS (Mandatory to implement):\n{user_suggestion}\n" if user_suggestion else ""

    # Pull post script content
    post_script = post_scripts[0] if post_scripts else {}
    headline = post_script.get("headline", "")
    body = post_script.get("body", "")
    cta = post_script.get("cta", "")

    # Pull visual concept if available
    visual_concept = visual_concepts[0] if visual_concepts else ""

    # Platform poster specs
    platform_specs = {
        "instagram": {
            "size": "1080x1080 square",
            "aspect": "1:1",
            "layout_note": "Instagram-style square, bold center-left composition, mobile-first"
        },
        "youtube": {
            "size": "1280x720 thumbnail",
            "aspect": "16:9",
            "layout_note": "YouTube thumbnail, subject right, bold text left, high contrast"
        },
        "linkedin": {
            "size": "1200x627 landscape",
            "aspect": "1.91:1",
            "layout_note": "LinkedIn professional layout, clean corporate feel, brand colors dominant"
        },
        "twitter": {
            "size": "1600x900 landscape",
            "aspect": "16:9",
            "layout_note": "Twitter card, minimal clean layout, quote-card style"
        }
    }

    ps = platform_specs.get(platform, platform_specs["instagram"])

    # App context injection
    app_context_str = ""
    if app_context:
        features = app_context.get("key_features", [])
        app_context_str = f"""
App/Product Details:
- Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key features: {', '.join(features[:3]) if features else ''}
- USP: {app_context.get('unique_selling_points', [''])[0] if app_context.get('unique_selling_points') else ''}
"""

    # ── Brand Identity Injection ──────────────────────────────────────
    brand_identity = state.get("brand_identity", {})

    brand_identity_str = ""
    if brand_identity:
        parts = []

        if brand_identity.get("primary_color"):
            parts.append(f"Primary brand color: {brand_identity['primary_color']}")

        if brand_identity.get("secondary_color"):
            parts.append(f"Secondary brand color: {brand_identity['secondary_color']}")

        if brand_identity.get("button_color"):
            parts.append(f"CTA button color: {brand_identity['button_color']}")

        if brand_identity.get("font_family"):
            parts.append(f"Brand font: {brand_identity['font_family']}")

        if brand_identity.get("tagline"):
            parts.append(f"Brand tagline: {brand_identity['tagline']}")

        if brand_identity.get("brand_tone_words"):
            parts.append(
                f"Brand tone: {', '.join(brand_identity['brand_tone_words'])}"
            )

        if brand_identity.get("logo_compositing"):
            parts.append(
                "NOTE: Real brand logo will be composited on top-left after generation. "
                "Leave top-left corner area clean with minimal visual clutter. "
                "Do NOT generate a logo or brand name text in the image — "
                "the real logo will be placed there automatically."
            )
        else:
            parts.append(
                f"Brand name '{brand_name}' must appear top-left in clean "
                f"{'font: ' + brand_identity.get('font_family', 'sans-serif') if brand_identity.get('font_family') else 'sans-serif font'}, "
                f"color: {brand_identity.get('primary_color', 'white') or 'white'}"
            )

        brand_identity_str = "\nBRAND IDENTITY DETAILS:\n" + "\n".join(parts)

    selected_format  = state.get("selected_format", "lifestyle_shot")
    format_metadata  = state.get("format_metadata", {})
    detected_field   = state.get("detected_field", "general")

    format_instruction = f"""
Post Format: {format_metadata.get('name', selected_format)}
Layout style: {format_metadata.get('layout', 'full_bleed_photo')}
Image composition: {format_metadata.get('image_composition', 'person_in_environment')}
Person required: {format_metadata.get('person_required', True)}
Copy tone: {format_metadata.get('copy_style', 'emotion_led')}
Industry field: {detected_field}

Apply the above format constraints strictly when composing the visual.
"""

    prompt = f"""
You are a world-class art director and AI image prompt engineer.
You write advertisement poster prompts using a precise compositional
deconstruction format that results in pixel-perfect professional output.

Here is an EXAMPLE of the EXACT format and quality required.
Study every detail — the high_level_description, background scene,
each element with type/desc/text, typography treatment, and color values:

=== EXAMPLE OUTPUT — FORMAT REFERENCE ONLY, DO NOT COPY CONTENT ===

NATURAL LANGUAGE PROMPT:
A professional social media advertisement poster for "RentIt", a property
rental and buying app. Background: a confident young Indian man in his mid-20s
standing on a modern apartment balcony, Bangalore city skyline at dusk behind
him, holding a smartphone, smiling.
The poster must clearly display these text elements with no errors:
- Bold headline at top-left: "Stop Scrolling. Start Living."
- Supporting text: "Find your perfect rental in minutes. No brokers, no hidden fees."
- Brand name in clean modern font top-left: "RentIt."
- CTA button: "Find Your Space Today"
- Small hashtag bottom-right corner: "#RentSmarter"
Instagram-style square poster, dark overlay on left half for text contrast,
crisp white typography, premium app advertisement aesthetic.

COMPOSITIONAL JSON:
{{
  "high_level_description": "A premium Instagram-square social media advertisement for RentIt featuring a confident young Indian man on a modern balcony holding his phone against a Bangalore dusk skyline, with stacked white headline typography and a coral CTA button on the left.",
  "compositional_deconstruction": {{
    "background": "Bangalore city skyline at dusk filling the frame — layered silhouettes of high-rise towers with scattered warm window lights glowing across the buildings. Dusk sky gradient shifts from deep indigo at the top to soft coral-peach near the horizon. A soft dark gradient overlay deepens the left half of the frame for typography contrast. Neutral cool-toned white balance overall, fine editorial grain across the image.",
    "elements": [
      {{
        "type": "obj",
        "desc": "Modern glass-and-steel balcony railing running horizontally across the lower-mid frame, brushed aluminum top rail catching the last light, transparent glass panels below."
      }},
      {{
        "type": "obj",
        "desc": "Confident young Indian man in his mid-20s, anchored on the right two-thirds of the frame, body filling roughly 60% of the frame height. Standing on a modern apartment balcony, weight settled on his left leg, body angled three-quarters toward camera. Short neatly styled black hair, light stubble, medium-warm brown skin tone. Wearing a fitted charcoal crewneck tee under an unbuttoned olive utility overshirt, dark slim jeans. Right hand holds a smartphone at chest height; left hand rests casually on the balcony railing. Glances down at the screen with a small genuine smile."
      }},
      {{
        "type": "text",
        "text": "RentIt.",
        "desc": "Brand wordmark in the upper-left corner. Clean geometric sans-serif, medium size, pure white, left-aligned. Small coral-orange accent dot after the last letter."
      }},
      {{
        "type": "text",
        "text": "Stop Scrolling.\\nStart Living.",
        "desc": "Bold headline stacked across two lines in the upper-left quadrant. Heavy modern sans-serif, large display size, crisp pure white, tight leading, left-aligned."
      }},
      {{
        "type": "text",
        "text": "Find your perfect rental in minutes. No brokers, no hidden fees.",
        "desc": "Supporting sub-headline beneath the main headline, left-aligned. Lighter-weight white sans-serif, smaller than the headline."
      }},
      {{
        "type": "text",
        "text": "Find Your Space Today",
        "desc": "CTA label inside a coral-orange rounded-pill button in the lower-left third. Bold white sans-serif, medium size, centered within the pill, with a soft drop shadow."
      }},
      {{
        "type": "text",
        "text": "#RENTSMARTER",
        "desc": "Small hashtag in the bottom-right corner. Tracked caps, thin white sans-serif, with a thin white underline rule beneath."
      }}
    ]
  }}
}}

=== END EXAMPLE ===

Now generate a poster prompt at EXACTLY this quality level for:

BRAND: {brand_name}
TOPIC: {topic}
PLATFORM: {platform.upper()} — {ps['size']} ({ps['aspect']})
LAYOUT: {ps['layout_note']}
TARGET AUDIENCE: {target_audience}
IMAGE STYLE: {image_style}, photorealistic, ultra HD
TONE: {tone}
BRAND COLORS: {', '.join(brand_colors)}
CTA GOAL: {cta_goal}
VISUAL CONCEPT: {visual_concept}
{app_context_str}
{brand_identity_str}
{suggestion_str}

POST SCRIPT CONTENT — use these EXACTLY as poster text:
Headline: "{headline}"
Body copy: "{body}"
CTA button: "{cta}"

OUTPUT FORMAT — return BOTH sections exactly like the example:

1. NATURAL LANGUAGE PROMPT:
[Full paragraph describing the scene, person, and all text elements.
Same style as the example. 4-6 sentences.]

2. COMPOSITIONAL JSON:
[Full JSON object with high_level_description and compositional_deconstruction.
Every text element must be its own entry with type, text, and desc fields.
Every object/character must be its own entry with type and desc fields.
Background must be 3-5 sentences describing scene, lighting, sky, overlays.]

STRICT RULES:
1. Character must be Indian matching: {target_audience}
2. Character position must be specified: which side of frame, body angle,
   what they are doing, clothing description, expression
3. Every text element needs: exact position, font weight, color, size descriptor
4. Brand name "{brand_name}" must be top-left or top-center always
5. CTA must be a pill/button shape with brand color — never plain text
6. Background must specify: location, time of day, lighting, sky, overlay treatment
7. Text in poster must use EXACTLY the headline/body/cta provided — never paraphrase
8. CRITICAL COLOR RULE: You MUST ensure text is perfectly readable! If the background is light, text MUST be DARK (black or dark brand color). If the background is dark, text MUST be WHITE. NEVER put white text on a light background. Always specify a solid contrast panel, dark overlay, or heavy drop shadow behind text.
9. Image size must be {ps['size']}
10. DO NOT copy example content — generate fresh for {brand_name}

{format_instruction}
"""

    try:
        generated_prompt = invoke_with_fallback([HumanMessage(content=prompt)])
        state["image_prompts"] = [generated_prompt.strip()]
        print(f"[DEBUG] image_prompts set — length: {len(generated_prompt)}")
    except Exception as e:
        print(f"[ERROR] Image prompt agent failed: {e}")
        state["errors"] = state.get("errors", []) + [
            f"Image prompt agent failed: {str(e)}"
        ]
        state["image_prompts"] = []

    return state
