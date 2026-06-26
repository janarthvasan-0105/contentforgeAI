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


async def caption_agent(state: ContentState) -> ContentState:
    top_script = state.get("scripts", [{}])[1] if len(state.get("scripts", [])) > 1 else {}
    script_hook = top_script.get("hook", state["topic"])

    prompt = f"""
    You are a social media copywriter for {state['platform']}.

    Topic: {state['topic']}
    Platform: {state['platform']}
    Audience: {state['audience']}
    Script Hook: {script_hook}
    Pain Points: {state.get('pain_points', [])[:2]}

    Write 4 caption variants for the same content. Return ONLY valid JSON:
    {{
      "professional": "2-3 sentence professional caption with line breaks. Ends with a question.",
      "educational": "Caption that teaches something specific. Uses numbered points or a mini-lesson format.",
      "funny": "Light, relatable caption with humor. Max 2 sentences.",
      "storytelling": "Caption that starts with a personal/relatable story moment. 3-4 sentences."
    }}

    Rules:
    - Each caption must be under 2200 characters (Instagram limit)
    - Include 1-2 relevant emojis naturally
    - End each with a CTA or question to drive engagement
    - Do NOT include hashtags (handled by Hashtag Agent)
    - CRITICAL: NEVER use raw newlines inside the JSON strings. Use literal '\\n' for line breaks.
    """

    result_text = invoke_with_fallback([
        SystemMessage(content="You are an expert copywriter. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    parsed = extract_json(result_text)

    return {
        **state,
        "captions": parsed,
        "status": "captions_generated",
    }
