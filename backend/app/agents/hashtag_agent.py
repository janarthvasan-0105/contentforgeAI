from app.models.state import ContentState
from app.utils.llm import async_invoke_with_fallback
from langchain_core.messages import HumanMessage, SystemMessage
from app.utils.suggestion_utils import build_suggestion_constraint
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


async def hashtag_agent(state: ContentState) -> ContentState:
    prompt = f"""
    You are a hashtag research specialist for {state['platform']}.

    Topic: {state['topic']}
    Platform: {state['platform']}
    Audience: {state['audience']}
    Interests: {state.get('interests', [])}
    {build_suggestion_constraint(state.get("user_suggestion"))}

    Generate a hashtag strategy. Return ONLY valid JSON:
    {{
      "broad": [
        "#Hashtag1",
        "#Hashtag2",
        "#Hashtag3"
      ],
      "medium": [
        "#MoreSpecific1",
        "#MoreSpecific2",
        "#MoreSpecific3",
        "#MoreSpecific4",
        "#MoreSpecific5"
      ],
      "niche": [
        "#VerySpecific1",
        "#VerySpecific2",
        "#VerySpecific3",
        "#VerySpecific4",
        "#VerySpecific5",
        "#VerySpecific6",
        "#VerySpecific7"
      ],
      "recommended_mix": "Copy-paste ready hashtag block combining broad + medium + niche",
      "total_count": 15
    }}

    Hashtag rules:
    - Broad: 1M+ posts (e.g., #AI, #TechTips)
    - Medium: 100K-1M posts (e.g., #AITools, #LearnAI)
    - Niche: <100K posts (e.g., #AIForEngineers, #AutomateWithAI)
    - Recommended mix: 3 broad + 5 medium + 7 niche = 15 total
    - All hashtags must be relevant and spelled correctly
    """

    result_text = await async_invoke_with_fallback([
        SystemMessage(content="You are an SEO and hashtag expert. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    parsed = extract_json(result_text)

    return {
        **state,
        "hashtags": parsed,
        "status": "hashtags_generated",
    }
