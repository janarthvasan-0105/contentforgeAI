from app.models.state import ContentState
from app.utils.llm import async_invoke_with_fallback
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


async def strategy_agent(state: ContentState) -> ContentState:
    memory_context = state.get("memory_context", "No previous context available.")

    prompt = f"""
    You are a senior content strategist for {state['platform']}.

    Topic: {state['topic']}
    Audience: {state['audience']}
    Tone: {state['tone']}
    Platform: {state['platform']}

    Research Insights:
    - Trends: {state.get('trends', [])}
    - Pain Points: {state.get('pain_points', [])}
    - Interests: {state.get('interests', [])}
    - FAQs: {state.get('faqs', [])}

    Memory from previous generations:
    {memory_context}

    Create a content direction strategy. Return ONLY valid JSON:
    {{
      "hook_style": "question|bold_statement|shocking_stat|story",
      "script_length": "15s|30s|60s",
      "content_angle": "The specific angle to take (e.g. AI tools beginners miss)",
      "primary_emotion": "curiosity|surprise|motivation|empathy",
      "unique_value_prop": "What makes this content stand out",
      "format_recommendation": "reel|carousel|post|all",
      "posting_time": "Best time to post for this platform and audience"
    }}
    """

    result_text = await async_invoke_with_fallback([
        SystemMessage(content="You are a content strategy expert. Return only valid JSON."),
        HumanMessage(content=prompt),
    ], quality=True)

    parsed = extract_json(result_text)

    return {
        **state,
        "content_direction": parsed,
        "status": "strategy_complete",
    }
