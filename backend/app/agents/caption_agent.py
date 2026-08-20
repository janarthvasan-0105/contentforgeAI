from app.models.state import ContentState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re
import asyncio



def extract_json(text: str) -> dict:
    match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if match:
        text = match.group(1)
    else:
        # Fallback to finding the first { and last }
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            text = text[start:end+1]
    try:
        return json.loads(text.strip())
    except Exception:
        return {}


async def caption_agent(state: ContentState) -> ContentState:
    top_script = state.get("scripts", [{}])[0] if state.get("scripts") and len(state.get("scripts", [])) > 0 else {}
    script_hook = top_script.get("hook", state.get("topic", ""))

    platform = state.get('platform', 'any platform')
    topic = state.get('topic', 'General topic')
    audience = state.get('target_audience', state.get('audience', 'General audience'))
    pain_points = state.get('pain_points', [])[:2] if state.get('pain_points') else []

    prompt = f"""
    You are a social media copywriter for {platform}.

    Topic: {topic}
    Platform: {platform}
    Audience: {audience}
    Script Hook: {script_hook}
    Pain Points: {pain_points}

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

    messages = [
        SystemMessage(content="You are an expert copywriter. Return only valid JSON."),
        HumanMessage(content=prompt),
    ]

    # Run synchronous LLM call in a thread pool to avoid blocking the async event loop
    result_text = await asyncio.to_thread(invoke_with_fallback, messages)

    parsed = extract_json(result_text)

    # If parsing fails, return a basic fallback so captions aren't completely empty
    if not parsed:
        print(f"[CaptionAgent] JSON parse failed. Raw response: {result_text[:300]}")
        parsed = {
            "professional": f"Discover {topic}. Designed for {audience}. What's your take? 💡",
            "educational": f"Here's what you need to know about {topic}. Perfect for {audience}. Share your thoughts below!",
            "funny": f"Nobody told us {topic} would be this interesting 😅 Tag someone who needs this!",
            "storytelling": f"We started exploring {topic} and here's what we found... 🚀 What's your experience with this?"
        }

    return {
        **state,
        "captions": parsed,
        "status": "captions_generated",
    }
