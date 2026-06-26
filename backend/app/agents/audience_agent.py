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


async def audience_agent(state: ContentState) -> ContentState:
    prompt = f"""
    You are an audience research expert for social media content.

    Topic: {state['topic']}
    Platform: {state['platform']}
    Target Audience: {state.get('target_audience', state.get('audience', 'General audience'))}
    Trends Found: {state.get('trends', [])}
    Questions Found: {state.get('questions', [])}

    Deeply analyze this audience and return ONLY valid JSON:
    {{
      "pain_points": [
        "Specific pain point 1",
        "Specific pain point 2",
        "Specific pain point 3",
        "Specific pain point 4",
        "Specific pain point 5"
      ],
      "interests": [
        "interest1", "interest2", "interest3", "interest4", "interest5"
      ],
      "faqs": [
        "FAQ question 1?",
        "FAQ question 2?",
        "FAQ question 3?",
        "FAQ question 4?",
        "FAQ question 5?"
      ]
    }}
    """

    result_text = invoke_with_fallback([
        SystemMessage(content="You are an audience research expert. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    parsed = extract_json(result_text)

    return {
        **state,
        "pain_points": parsed.get("pain_points", []),
        "interests": parsed.get("interests", []),
        "faqs": parsed.get("faqs", []),
        "status": "audience_complete",
    }
