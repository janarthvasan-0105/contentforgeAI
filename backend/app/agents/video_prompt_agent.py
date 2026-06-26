from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage


async def video_prompt_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates a detailed cinematic frame-by-frame video generation prompt
    for Runway Gen-4. Output quality must match professional ad director level.
    """
    brand_name = state.get("brand_name", "Brand")
    platform = state.get("platform", "instagram").lower()
    video_script = state.get("video_script", {})
    video_config = state.get("video_config", {})
    app_context = state.get("app_context", {})
    topic = state.get("topic", "")
    target_audience = state.get("target_audience", state.get("audience", ""))
    image_style = state.get("image_style", "realistic")
    tone = state.get("tone", "educational")

    tutorial_script = state.get("tutorial_script", {})
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str = f"\nUSER DIRECTIVES / CRITICAL STYLE SUGGESTIONS (Mandatory to implement):\n{user_suggestion}\n" if user_suggestion else ""
    
    # Use tutorial script if it's populated (for YouTube App/Website)
    if tutorial_script and isinstance(tutorial_script, dict) and tutorial_script.get("hook"):
        hook_text = tutorial_script.get("hook", "")
        value_text = tutorial_script.get("sections", [{}])[0].get("script", "") if tutorial_script.get("sections") else ""
        cta_text = "Download now / Link in description"
        script_duration = "3-5 minutes"
    else:
        # Default to standard video script
        hook_text = video_script.get("hook", "")
        value_text = video_script.get("value", "")
        cta_text = video_script.get("cta", "")
        script_duration = str(video_script.get("duration", "")).strip()

    if script_duration:
        actual_duration = script_duration if "s" in script_duration.lower() or "m" in script_duration.lower() else f"{script_duration} seconds"
    else:
        min_d = video_config.get('duration_min', 15)
        max_d = video_config.get('duration_max', 90)
        actual_duration = f"{min_d}–{max_d} seconds"

    # Platform constraints
    platform_constraints = {
        "instagram": {
            "frame_size": "1080x1920",
            "aspect_ratio": "9:16 vertical",
            "num_frames": 4,
            "style_notes": "fast-paced, trendy, scroll-stopping, entertainment-focused",
            "camera_style": "handheld energy, quick cuts, dynamic angles",
            "color_grade": "vibrant, high contrast, warm tones",
            "character_note": "young Indian adults 20s–30s, urban lifestyle"
        },
        "youtube": {
            "frame_size": "1920x1080",
            "aspect_ratio": "16:9 landscape",
            "num_frames": 5,
            "style_notes": "educational, detailed, informative, trustworthy",
            "camera_style": "steady, deliberate, professional — gimbal or tripod",
            "color_grade": "clean, bright, professional color grading",
            "character_note": "professional Indian adults 25–40s, knowledgeable presenter"
        },
        "linkedin": {
            "frame_size": "1920x1080",
            "aspect_ratio": "16:9 landscape",
            "num_frames": 4,
            "style_notes": "professional, credible, business-focused, authoritative",
            "camera_style": "smooth steadicam, corporate aesthetic, clean compositions",
            "color_grade": "desaturated professional tones, blue and grey palette",
            "character_note": "professional Indian adults 28–45, business attire"
        }
    }

    pc = platform_constraints.get(platform, platform_constraints["instagram"])

    # App context injection
    app_context_str = ""
    if app_context:
        features = app_context.get("key_features", [])
        app_context_str = f"""
App/Product Details to feature in video:
- App Name: {app_context.get('app_name', brand_name)}
- Core description: {app_context.get('description', '')}
- Key features to show on screen: {', '.join(features[:3]) if features else 'main features'}
- Unique selling point: {app_context.get('unique_selling_points', [''])[0] if app_context.get('unique_selling_points') else ''}
"""

    # ── Brand Identity Injection ──────────────────────────────────────
    brand_identity = state.get("brand_identity", {})

    brand_identity_str = ""
    if brand_identity:
        parts = []

        if brand_identity.get("primary_color"):
            parts.append(
                f"Brand primary color: {brand_identity['primary_color']} — "
                f"use for text overlays and accent elements"
            )

        if brand_identity.get("secondary_color"):
            parts.append(
                f"Brand secondary color: {brand_identity['secondary_color']}"
            )

        if brand_identity.get("button_color"):
            parts.append(
                f"CTA button/accent color: {brand_identity['button_color']}"
            )

        if brand_identity.get("font_family"):
            parts.append(
                f"Brand font family: {brand_identity['font_family']} — "
                f"specify this for all text overlay descriptions"
            )

        if brand_identity.get("tagline"):
            parts.append(
                f"Official brand tagline: '{brand_identity['tagline']}' — "
                f"can be used in final frame if appropriate"
            )

        if brand_identity.get("brand_tone_words"):
            parts.append(
                f"Brand tone descriptors: {', '.join(brand_identity['brand_tone_words'])} — "
                f"reflect these in scene mood and cinematography style"
            )

        brand_identity_str = "\nBRAND IDENTITY:\n" + "\n".join(parts)

    system_instruction = """You are a world-class video director and AI prompt engineer.
You write prompts for AI video generation tools like Runway Gen-4.
Your prompts are always:
- Cinematic and visually specific
- Frame-by-frame with exact timestamps
- Detailed about camera movement, character, lighting, and scene
- Precise about text overlays — exact wording, placement, style
- Professional advertisement quality
Never write vague or generic prompts."""

    prompt = f"""
You are a world-class video director and AI prompt engineer specializing
in advertisement video generation prompts for tools like Runway Gen-4.

Here is an EXAMPLE of the EXACT quality, format, and detail level required.
Study every element — frame timestamps, camera movements, character descriptions,
text overlay placement, and cinematography notes:

=== EXAMPLE OUTPUT — FORMAT REFERENCE ONLY, DO NOT COPY CONTENT ===

A stylish 10-second cinematic video advertisement for "RentIt" — a property
platform for modern India. Four dynamic frames:

FRAME 1 (0-2s):
Aerial drone shot slowly descending over a glittering Indian metro city
skyline at dusk — Mumbai or Bangalore. City lights beginning to glow.
Warm amber and deep blue tones fill the sky. Camera movement: smooth
drone descent at 45-degree angle, slowly rotating right.
Text overlay top-center: "Your City. Your Space."

FRAME 2 (2-5s):
A confident young Indian man, mid-20s, wearing a light grey shirt and
dark jeans, walking through a bright modern apartment with white walls
and large windows. He runs his hand along the wall, looking around
approvingly, smiling slightly. Handheld camera follow shot from behind,
soft bokeh on windows behind him, golden afternoon light streaming in.
Text overlay bottom-left: "No Brokers. No Stress. Just the Right Home."

FRAME 3 (5-8s):
Extreme close-up of his hand tapping through the RentIt app on a
smartphone — screen shows property listings with apartment photos,
prices in rupees, and location tags. Camera slowly pulls back to a
medium shot revealing him smiling at the screen, standing by a window
with the city visible behind him. Lighting: warm indoor, soft shadows.
Text overlay center: "Browse. Connect. Move In."

FRAME 4 (8-10s):
He stands on a modern apartment balcony at night, city lights glittering
behind him, relaxed posture, arms resting on the railing, confident
expression. Camera: slow push-in from wide to medium close-up on his face.
Lighting: cool blue ambient city light with warm practical light from inside.
Bold centered text: "RentIt — Rent Smarter."
CTA bottom: "Available on iOS & Android"

High contrast cinematic look, cool blue to warm amber color grade
progression across all frames, smooth steadicam motion throughout,
aspirational lifestyle advertisement feel, no handheld shake.

=== END EXAMPLE ===

Now generate a video prompt at EXACTLY this quality level using the
details below. Match the structure precisely — same frame format,
same level of character detail, same camera movement specificity,
same text overlay placement style.

BRAND: {brand_name}
TOPIC: {topic}
PLATFORM: {platform.upper()} — {pc['aspect_ratio']}
TARGET AUDIENCE: {target_audience}
VIDEO DURATION: {actual_duration}
NUMBER OF FRAMES: {pc['num_frames']}
VISUAL STYLE: {image_style}, {pc['style_notes']}
CAMERA STYLE: {pc['camera_style']}
COLOR GRADE: {pc['color_grade']}
CHARACTER DESCRIPTION: {pc['character_note']}
TONE: {tone}
{app_context_str}
{brand_identity_str}
{suggestion_str}

SCRIPT CONTENT — use these as SHORT text overlays (max 3 words each):
Frame 1 hook overlay: "{hook_text[:30].split()[0:3]}" — shorten to 3 words
Middle frame overlay: "{value_text[:30].split()[0:3]}" — shorten to 3 words  
Final frame CTA: "{brand_name}"

STRICT RULES:
1. Every FRAME must have exact timestamps e.g. FRAME 1 (0-2s)
2. Every FRAME must specify: scene location, time of day, lighting
3. Every FRAME must specify: exact camera movement by name
4. Every FRAME must have SHORT text overlay — maximum 3-4 words only
   Example: "Find Home." not "Find your perfect dream home today"
5. Text overlays must be BOLD WHITE text, large font, left-aligned
6. Final FRAME must show brand name "{brand_name}" prominently
7. Characters must be Indian matching: {target_audience}
8. Color grade and cinematography style must be specified
9. Timestamps must add up correctly to total video duration
10. Keep text SHORT — 2-3 words per overlay maximum
    BAD:  "Tired of endless dating apps? Wiviy-a is here to change the game!"
    GOOD: "Find Your Match."
"""

    try:
        response_text = invoke_with_fallback([HumanMessage(content=prompt)])
        state["video_prompt"] = response_text.strip()
    except Exception as e:
        state["errors"] = state.get("errors", []) + [f"Video prompt agent failed: {str(e)}"]
        state["video_prompt"] = ""

    return state
