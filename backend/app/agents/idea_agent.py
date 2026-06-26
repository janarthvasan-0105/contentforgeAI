from app.models.state import ContentState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re



def extract_json(text: str) -> dict:
    match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if match:
        text = match.group(1)
    try:
        return json.loads(text.strip())
    except Exception:
        return {}


async def idea_agent(state: ContentState) -> ContentState:
    direction = state.get("content_direction", {})

    prompt = f"""
    You are a viral content idea generator for {state['platform']}.

    Topic: {state['topic']}
    Audience: {state['audience']}
    Tone: {state['tone']}
    Content Angle: {direction.get('content_angle', state['topic'])}
    Hook Style: {direction.get('hook_style', 'question')}
    Primary Emotion: {direction.get('primary_emotion', 'curiosity')}

    Pain Points: {state.get('pain_points', [])[:3]}
    Interests: {state.get('interests', [])[:3]}

    Generate viral content ideas. Return ONLY valid JSON:
    {{
      "reels": [
        "Reel idea 1 — specific hook angle",
        "Reel idea 2 — specific hook angle",
        "Reel idea 3 — specific hook angle",
        "Reel idea 4 — specific hook angle",
        "Reel idea 5 — specific hook angle"
      ],
      "carousels": [
        "Carousel idea 1 — slide theme",
        "Carousel idea 2 — slide theme",
        "Carousel idea 3 — slide theme",
        "Carousel idea 4 — slide theme",
        "Carousel idea 5 — slide theme"
      ],
      "posts": [
        "Post idea 1",
        "Post idea 2",
        "Post idea 3",
        "Post idea 4",
        "Post idea 5"
      ]
    }}
    """

    result_text = invoke_with_fallback([
        SystemMessage(content="You are a viral content expert. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    parsed = extract_json(result_text)

    return {
        **state,
        "reel_ideas": parsed.get("reels", []),
        "carousel_ideas": parsed.get("carousels", []),
        "post_ideas": parsed.get("posts", []),
        "status": "ideas_generated",
    }
