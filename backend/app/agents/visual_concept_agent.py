from app.models.state import ContentState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import SystemMessage, HumanMessage
import json
import re


def extract_json(text: str) -> dict:
    """Extract JSON from LLM output that may contain markdown fences."""
    match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if match:
        text = match.group(1)
    try:
        return json.loads(text.strip())
    except Exception:
        return {}


async def visual_concept_agent(state: ContentState) -> ContentState:
    """Decide what the post should visually depict based on brand and content."""
    selected_idea = (state.get("post_ideas") or [state["topic"]])[0]

    prompt = f"""
    Create visual concepts for a branded social media post.

    Brand: {state['brand_name']}
    Topic: {state['topic']}
    Audience: {state['audience']}
    Tone: {state['tone']}
    Visual style: {state.get('visual_style', 'modern')}
    Image style: {state.get('image_style', 'realistic')}
    Brand category: {state.get('brand_category', 'app')}
    CTA goal: {state.get('cta_goal', 'downloads')}
    Selected idea: {selected_idea}

    Return ONLY valid JSON:
    {{
      "visual_concepts": [
        {{
          "title": "Concept 1",
          "scene": "Describe the visual scene in detail",
          "subject": "Main subject of the image",
          "mood": "clean / aspirational / modern",
          "composition": "close-up / wide / centered",
          "use_case": "single_post"
        }}
      ]
    }}
    """

    result = invoke_with_fallback([
        SystemMessage(content="You are a brand visual strategist. Return only JSON."),
        HumanMessage(content=prompt)
    ], quality=True)

    parsed = extract_json(result)
    return {
        **state,
        "visual_concepts": parsed.get("visual_concepts", []),
        "status": "visual_concepts_ready",
    }
