import json
from groq import Groq
from app.config import get_settings

settings = get_settings()
groq_client = Groq(api_key=settings.groq_api_key)

MAX_RETRIES = 2

def check_suggestion_compliance(state: dict) -> dict:
    """
    LangGraph node. Runs after script/image/video-prompt/hashtag agents.
    Verifies the user's suggestion (if any) was actually honored.
    """
    suggestion = (state.get("user_suggestion") or "").strip()
    if not suggestion:
        state["compliance_passed"] = True
        state["needs_regeneration"] = False
        return state

    retry_count = state.get("compliance_retry_count", 0)

    image_prompts = state.get('image_prompts', [])
    image_prompt_text = str(image_prompts[0]) if image_prompts else ""
    summary = f"""
Script: {str(state.get('scripts', ''))[:500]}
Image prompt: {image_prompt_text[:300]}
Video prompt: {state.get('video_prompt', '')[:300]}
Hashtags: {', '.join(state.get('hashtags', {}).get('recommended_mix', [])[:10])}
""".strip()

    check_prompt = f"""
User's requirement: "{suggestion}"

Generated content summary:
{summary}

Does the generated content satisfy the user's requirement?
Reply with strict JSON only: {{"satisfied": true or false, "reason": "one short sentence"}}
""".strip()

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": check_prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        satisfied = result.get("satisfied", True)
        reason = result.get("reason", "")
    except Exception as e:
        print(f"[ComplianceAgent] Check failed, defaulting to pass: {e}")
        satisfied = True
        reason = "compliance check unavailable"

    state["compliance_passed"] = satisfied
    state["compliance_reason"] = reason

    if not satisfied and retry_count < MAX_RETRIES:
        state["compliance_retry_count"] = retry_count + 1
        state["needs_regeneration"] = True
        print(f"[ComplianceAgent] Not satisfied (attempt {retry_count + 1}): {reason}. Retrying.")
    else:
        state["needs_regeneration"] = False
        if not satisfied:
            print(f"[ComplianceAgent] Max retries reached. Proceeding best-effort. Reason: {reason}")

    return state
