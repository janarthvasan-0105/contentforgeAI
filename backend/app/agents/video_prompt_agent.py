import json
from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage
from app.utils.suggestion_utils import build_suggestion_constraint


async def video_prompt_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates a 4-scene, 8-keyframe JSON schema for the Groq + Ideogram + RIFE pipeline.
    """
    brand_name = state.get("brand_name", "Brand")
    platform = state.get("platform", "instagram").lower()
    video_script = state.get("video_script", {})
    app_context = state.get("app_context", {})
    topic = state.get("topic", "")
    target_audience = state.get("target_audience", state.get("audience", ""))
    image_style = state.get("image_style", "realistic")
    tone = state.get("tone", "educational")

    tutorial_script = state.get("tutorial_script", {})
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str = build_suggestion_constraint(user_suggestion)
    
    if tutorial_script and isinstance(tutorial_script, dict) and tutorial_script.get("hook"):
        hook_text = tutorial_script.get("hook", "")
        value_text = tutorial_script.get("sections", [{}])[0].get("script", "") if tutorial_script.get("sections") else ""
        cta_text = "Download now / Link in description"
    else:
        hook_text = video_script.get("hook", "")
        value_text = video_script.get("value", "")
        cta_text = video_script.get("cta", "")

    app_context_str = ""
    if app_context:
        features = app_context.get("key_features", [])
        app_context_str = f"""
App/Product Details to feature:
- App Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key features: {', '.join(features[:3]) if features else 'main features'}
- USP: {app_context.get('unique_selling_points', [''])[0] if app_context.get('unique_selling_points') else ''}
"""

    brand_identity = state.get("brand_identity", {})
    brand_identity_str = ""
    if brand_identity:
        parts = []
        if brand_identity.get("brand_tone_words"):
            parts.append(f"Brand tone descriptors: {', '.join(brand_identity['brand_tone_words'])}")
        brand_identity_str = "\nBRAND IDENTITY:\n" + "\n".join(parts)

    prompt = f"""
You are an expert video director and AI prompt engineer designing a 15-second cinematic video advertisement.
The video will be generated using a keyframe interpolation pipeline.

You must design EXACTLY 4 scenes. For each scene, you must provide 2 keyframes (start and end).
The duration of all 4 scenes MUST sum to exactly 15 seconds.

RULES:
1. `style_reference` must be a visually descriptive string that sets the artistic style, color grade, and lighting for the scene.
2. `keyframe_start` and `keyframe_end` MUST describe the exact same subject, same setting, same lighting, and same style. The ONLY difference between the two prompts should be a minor camera movement (e.g., zoom in, pan right) or slight subject motion. Large visual differences will break the interpolation.
3. `motion_prompt` MUST be a text description of the camera movement and subject motion between keyframe_start and keyframe_end. Describe camera movement first (e.g. push in, pull back), then subject motion, then mood/lighting. Keep it concrete and end with quality descriptors (e.g. "smooth realistic camera motion").
4. The prompt for each keyframe should be highly detailed and optimized for an image generation model (like Midjourney or Ideogram).

BRAND: {brand_name}
TOPIC: {topic}
PLATFORM: {platform.upper()}
TARGET AUDIENCE: {target_audience}
VISUAL STYLE: {image_style}
TONE: {tone}
{app_context_str}
{brand_identity_str}
{suggestion_str}

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact structure:
{{
  "video_title": "string",
  "total_duration_seconds": 15,
  "scenes": [
    {{
      "scene_number": 1,
      "duration_seconds": 3.75,
      "style_reference": "consistent style descriptor string",
      "keyframe_start": {{
        "prompt": "detailed image generation prompt for the starting frame"
      }},
      "keyframe_end": {{
        "prompt": "detailed image generation prompt for the ending frame, describing the SAME scene but with slightly different camera angle/zoom"
      }},
      "motion_prompt": "text description of the camera movement and subject motion between keyframe_start and keyframe_end — e.g. 'Camera slowly pushes in from a wide shot to a close-up. Subject leans in and smiles. Soft natural lighting, smooth realistic camera motion, cinematic handheld feel.'"
    }}
  ]
}}
Ensure the JSON is valid and contains exactly 4 items in the "scenes" array.
"""

    try:
        response_text = invoke_with_fallback(
            [HumanMessage(content=prompt)],
            quality=True
        )
        # Parse JSON
        text = response_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        parsed_schema = json.loads(text.strip())
        state["video_scenes_schema"] = parsed_schema
        # Ensure we have video_prompt populated so graph validation doesn't fail
        state["video_prompt"] = json.dumps(parsed_schema) 
    except Exception as e:
        print(f"Error in video_prompt_agent: {e}")
        state["errors"] = state.get("errors", []) + [f"Video prompt agent failed: {str(e)}"]
        state["video_scenes_schema"] = {}
        state["video_prompt"] = ""

    return state
