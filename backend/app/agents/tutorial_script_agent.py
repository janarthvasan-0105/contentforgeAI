import json
from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage

async def tutorial_script_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates a detailed YouTube tutorial script.
    Uses app_context for accurate feature-based tutorial steps.
    Only runs for YouTube + App/Website purpose.
    """
    platform = state.get("platform", "")
    purpose = state.get("purpose", "general")

    # Guard: only run for YouTube + non-general
    if platform.lower() != "youtube" or purpose == "general":
        state["tutorial_script"] = {}
        return state

    brand_name = state.get("brand_name", "Brand")
    topic = state.get("topic", "")
    target_audience = state.get("target_audience", state.get("audience", ""))
    app_context = state.get("app_context", {})
    cta_goal = state.get("cta_goal", "downloads")
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str = f"\nUSER DIRECTIVES / CRITICAL STYLE SUGGESTIONS (Mandatory to implement):\n{user_suggestion}\n" if user_suggestion else ""

    app_context_str = ""
    if app_context:
        app_context_str = f"""
App Details:
- Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key Features: {', '.join(app_context.get('key_features', []))}
- Target Users: {app_context.get('target_users', '')}
"""

    prompt = f"""
You are a YouTube tutorial scriptwriter specializing in app and software tutorials.

Write a detailed tutorial script for YouTube with these specs:
- App/Product: {brand_name}
- Topic: {topic}
- Target Audience: {target_audience}
- Video Length: 3-5 minutes
- Hook: First 5-15 seconds must clearly state what viewer will learn
- CTA Goal: {cta_goal}
{app_context_str}
{suggestion_str}

The tutorial must cover:
1. Hook — what the viewer will learn (5-15 sec)
2. Introduction — what the app does and why it matters
3. Step-by-step feature walkthrough based on app context
4. Tips and best practices
5. CTA — download/sign up/visit

Return ONLY a valid JSON object:
{{
    "title": "YouTube video title (SEO optimized)",
    "hook": "opening hook script — first 5-15 seconds",
    "sections": [
        {{
            "timestamp": "0:00",
            "title": "section title",
            "script": "word-for-word script for this section"
        }}
    ],
    "full_script": "complete word-for-word script",
    "duration": "estimated duration e.g. 4 minutes",
    "cta": "closing call to action"
}}
"""

    try:
        response_text = invoke_with_fallback([HumanMessage(content=prompt)])
        text = response_text.strip().replace("```json", "").replace("```", "").strip()
        tutorial_script = json.loads(text)
        state["tutorial_script"] = tutorial_script
    except Exception as e:
        state["errors"] = state.get("errors", []) + [f"Tutorial script agent failed: {str(e)}"]
        state["tutorial_script"] = {}

    return state
