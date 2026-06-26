import json
import re
from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage


def close_incomplete_json(json_str: str) -> str:
    """
    Closes unclosed JSON brackets and quotes in a truncated JSON string.
    """
    stack = []
    in_string = False
    escape = False
    clean_str = ""
    
    for char in json_str:
        if escape:
            escape = False
            clean_str += char
            continue
        if char == '\\':
            escape = True
            clean_str += char
            continue
        if char == '"':
            in_string = not in_string
            clean_str += char
            continue
        
        if not in_string:
            if char in ['{', '[']:
                stack.append(char)
            elif char in ['}', ']']:
                if stack:
                    stack.pop()
        clean_str += char
        
    if in_string:
        clean_str += '"'
        
    while stack:
        open_bracket = stack.pop()
        if open_bracket == '{':
            clean_str += '}'
        elif open_bracket == '[':
            clean_str += ']'
            
    return clean_str


def extract_json_robust(text: str, is_array: bool = False):
    """
    Robustly extracts JSON from LLM response text.
    Handles markdown fences, trailing commas, extra text before/after JSON, and truncated output.
    """
    if not text:
        return [] if is_array else {}

    # Step 1: Strip markdown code fences
    text = re.sub(r'```(?:json)?\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()

    # Step 2: Try direct parse
    try:
        fixed = re.sub(r',\s*}', '}', text)
        fixed = re.sub(r',\s*]', ']', fixed)
        start_char = '[' if is_array else '{'
        end_char = ']' if is_array else '}'
        start_idx = fixed.find(start_char)
        end_idx = fixed.rfind(end_char)
        if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
            return json.loads(fixed[start_idx:end_idx + 1])
    except Exception:
        pass

    # Step 3: Fix unescaped newlines inside string values
    def fix_newlines(s):
        result = []
        in_string = False
        escape = False
        for ch in s:
            if escape:
                result.append(ch)
                escape = False
            elif ch == '\\':
                result.append(ch)
                escape = True
            elif ch == '"' and not escape:
                in_string = not in_string
                result.append(ch)
            elif ch == '\n' and in_string:
                result.append('\\n')
            elif ch == '\r' and in_string:
                result.append('\\r')
            else:
                result.append(ch)
        return ''.join(result)

    # Step 4: Backtrack from the end to find the longest prefix that parses successfully when closed
    for length in range(len(text), 0, -1):
        candidate = text[:length].rstrip()
        if not candidate:
            continue
        
        # Strip trailing commas, colons, or opening quotes that break JSON syntax
        if candidate.endswith(',') or candidate.endswith(':'):
            candidate = candidate[:-1].rstrip()
            
        closed = close_incomplete_json(candidate)
        closed = fix_newlines(closed)
        
        # Clean trailing commas
        closed = re.sub(r',\s*}', '}', closed)
        closed = re.sub(r',\s*]', ']', closed)
        
        start_char = '[' if is_array else '{'
        start_idx = closed.find(start_char)
        if start_idx == -1:
            continue
            
        try:
            val = json.loads(closed[start_idx:])
            if val:
                return val
        except Exception:
            pass

    print(f"[ERROR] All JSON extraction attempts failed. Raw text: {text[:500]}")
    return [] if is_array else {}


async def script_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Generates platform-specific video script and post scripts.
    Uses app_context if available (App/Website purpose).
    """
    topic = state.get("topic", "")
    brand_name = state.get("brand_name", "Brand")
    platform = state.get("platform", "instagram")
    tone = state.get("tone", "educational")
    target_audience = state.get("target_audience", state.get("audience", "general audience"))
    post_type = state.get("post_type", "single_post")
    cta_goal = state.get("cta_goal", "downloads")
    video_config = state.get("video_config", {})
    app_context = state.get("app_context", {})
    purpose = state.get("purpose", "general")
    user_suggestion = state.get("user_suggestion", "") or ""
    suggestion_str = f"\nUSER DIRECTIVES / CRITICAL STYLE SUGGESTIONS (Mandatory to implement):\n{user_suggestion}\n" if user_suggestion else ""

    # Build app context string
    app_context_str = ""
    if app_context and purpose != "general":
        app_context_str = f"""
App/Website Context:
- Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key Features: {', '.join(app_context.get('key_features', []))}
- Target Users: {app_context.get('target_users', '')}
- Unique Selling Points: {', '.join(app_context.get('unique_selling_points', []))}
"""

    # ── TWITTER BRANCH ────────────────────────────────────────────
    if platform == "twitter":
        twitter_app_context_str = ""
        if app_context and purpose != "general":
            features = app_context.get("key_features", [])
            twitter_app_context_str = f"""
App/Website Details:
- Name: {app_context.get('app_name', brand_name)}
- Description: {app_context.get('description', '')}
- Key features: {', '.join(features[:3]) if features else ''}
- USP: {app_context.get('unique_selling_points', [''])[0] if app_context.get('unique_selling_points') else ''}
"""

        twitter_instructions = state.get("twitter_instructions", "")

        twitter_prompt = f"""
You are an expert Twitter/X content strategist for Indian brands.

{twitter_instructions}

Rules:
- Every tweet: maximum 280 characters
- Line-break style: each sentence on its own line, use \\n between lines
- Never write paragraphs
- CTA must be soft: "Link in bio", "Thoughts?", "Thread below 👇"
- Maximum 2 hashtags total
- Tone: {tone}
- Target: {target_audience}

BRAND: {brand_name}
TOPIC: {topic}
CTA GOAL: {cta_goal}
{twitter_app_context_str}
{suggestion_str}

Return ONLY valid JSON. No explanation. No markdown:

{{
    "type1_line_break": {{
        "text": "Line1\\nLine2\\nLine3\\nLine4",
        "style": "line_break",
        "image_count": 1,
        "char_count": 0
    }},
    "type2_grid": {{
        "text": "Short headline. One benefit line. #Tag1 #Tag2",
        "style": "grid",
        "image_count": 4,
        "hashtags": ["Tag1", "Tag2"]
    }},
    "type3_thread": {{
        "hook": "Hook tweet under 280 chars 🧵",
        "tweets": [
            {{"number": 1, "text": "Tweet 1"}},
            {{"number": 2, "text": "Tweet 2"}},
            {{"number": 3, "text": "Tweet 3"}},
            {{"number": 4, "text": "Tweet 4"}},
            {{"number": 5, "text": "Tweet 5"}},
            {{"number": 6, "text": "Final CTA tweet. Link in bio."}}
        ],
        "style": "thread"
    }}
}}
"""

        try:
            raw = invoke_with_fallback([HumanMessage(content=twitter_prompt)])
            print(f"[DEBUG] Twitter raw response: {raw[:300]}")
            twitter_scripts = extract_json_robust(raw, is_array=False)

            t1 = twitter_scripts.get("type1_line_break", {})
            if t1.get("text"):
                t1["char_count"] = len(t1["text"].replace("\\n", "\n"))

            state["twitter_scripts"] = twitter_scripts
            state["post_scripts"] = [{
                "slide_number": 1,
                "role": "single_post",
                "headline": t1.get("text", "").split("\\n")[0],
                "body": t1.get("text", ""),
                "cta": cta_goal
            }]
            state["video_script"] = {
                "hook": topic,
                "value": t1.get("text", ""),
                "cta": cta_goal,
                "full_script": t1.get("text", ""),
                "duration": "15",
                "platform": "twitter"
            }
            state["scripts"] = [{
                "duration": "15s",
                "hook": t1.get("text", "").split("\\n")[0],
                "value": t1.get("text", ""),
                "cta": cta_goal,
                "full_script": t1.get("text", "")
            }]

        except Exception as e:
            print(f"[ERROR] Twitter script agent failed: {e}")
            state["errors"] = state.get("errors", []) + [f"Twitter script failed: {str(e)}"]
            state["twitter_scripts"] = {}

        return state

    # ── VIDEO SCRIPT ──────────────────────────────────────────────
    video_script_prompt = f"""
You are an expert {platform} content creator and scriptwriter.

Write a video script for {platform.upper()} with these specs:
- Brand: {brand_name}
- Topic: {topic}
- Target Audience: {target_audience}
- Tone: {tone}
- Video Length: {video_config.get('duration_min', 15)}-{video_config.get('duration_max', 90)} seconds
- Hook Duration: First {video_config.get('hook_duration', 3)} seconds
- Style: {video_config.get('style', 'engaging')}
- Hook Guidance: {video_config.get('hook_guidance', '')}
- CTA Goal: {cta_goal}
{app_context_str}
{suggestion_str}

Return ONLY valid JSON. No markdown. No explanation:
{{
    "hook": "Opening line that grabs attention in first {video_config.get('hook_duration', 3)} seconds",
    "value": "Main value delivery — features, benefits, proof",
    "cta": "Closing call to action for {cta_goal}",
    "full_script": "Complete word-for-word script here",
    "duration": "{video_config.get('duration_min', 15)}-{video_config.get('duration_max', 90)} seconds",
    "platform": "{platform}"
}}
"""

    # ── POST SCRIPT ───────────────────────────────────────────────
    selected_format = state.get("selected_format", "lifestyle_shot")
    format_metadata = state.get("format_metadata", {})

    copy_style_instruction = f"""
The post uses the '{format_metadata.get('name', selected_format)}' visual format.
Write copy in '{format_metadata.get('copy_style', 'emotion_led')}' style.
Match the energy and tone to this format — e.g. data_driven formats need bold
numbers up front; testimonial formats need a relatable quote lead.
"""

    if post_type == "carousel":
        post_script_prompt = f"""
You are an expert social media copywriter.

Write 3 carousel post scripts for {platform.upper()}.
Narrative arc:
- Slide 1 HOOK: stop the scroll, bold problem statement
- Slide 2 VALUE: solution delivery, feature highlight  
- Slide 3 CTA: drive action for {cta_goal}

Brand: {brand_name}
Topic: {topic}
Target Audience: {target_audience}
Tone: {tone}
{app_context_str}
{suggestion_str}
{copy_style_instruction}

Return ONLY valid JSON array. No markdown. No explanation:
[
    {{
        "slide_number": 1,
        "role": "hook",
        "headline": "Attention-grabbing headline here",
        "body": "Supporting copy 1-2 lines",
        "cta": ""
    }},
    {{
        "slide_number": 2,
        "role": "value",
        "headline": "Value proposition headline here",
        "body": "Feature or benefit copy here",
        "cta": ""
    }},
    {{
        "slide_number": 3,
        "role": "cta",
        "headline": "Action headline here",
        "body": "Urgency or social proof line",
        "cta": "Specific action for {cta_goal}"
    }}
]
"""
    else:
        post_script_prompt = f"""
You are an expert social media copywriter.

Write 1 advertisement post script for {platform.upper()}.

Brand: {brand_name}
Topic: {topic}
Target Audience: {target_audience}
Tone: {tone}
CTA Goal: {cta_goal}
{app_context_str}
{suggestion_str}
{copy_style_instruction}

Return ONLY valid JSON array. No markdown. No explanation:
[
    {{
        "slide_number": 1,
        "role": "single_post",
        "headline": "Powerful advertisement headline here",
        "body": "Compelling body copy 2-3 lines here",
        "cta": "Clear call to action for {cta_goal}",
        "image_prompt": "Brief visual note for this poster"
    }}
]
"""

    # ── GENERATE VIDEO SCRIPT ─────────────────────────────────────
    try:
        raw_video = invoke_with_fallback([HumanMessage(content=video_script_prompt)])
        print(f"[DEBUG] Raw video script (first 300): {raw_video[:300]}")

        video_script = extract_json_robust(raw_video, is_array=False)
        print(f"[DEBUG] Parsed video_script: {video_script}")

        if not isinstance(video_script, dict) or not video_script:
            raise ValueError(f"video_script parsed as empty or wrong type: {type(video_script)}")

        # Ensure all values are strings
        for k in ["hook", "value", "cta", "full_script", "duration", "platform"]:
            video_script[k] = str(video_script.get(k, ""))

        state["video_script"] = video_script
        print(f"[DEBUG] video_script set in state — hook: {video_script.get('hook', '')[:80]}")

    except Exception as e:
        print(f"[ERROR] Video script failed: {e}")
        state["errors"] = state.get("errors", []) + [f"Video script failed: {str(e)}"]
        state["video_script"] = {
            "hook": f"Discover {brand_name} today",
            "value": f"{brand_name} helps {target_audience} with {topic}",
            "cta": f"{cta_goal} — try {brand_name} now",
            "full_script": f"Discover {brand_name}. Built for {target_audience}. {cta_goal} today.",
            "duration": f"{video_config.get('duration_min', 15)}-{video_config.get('duration_max', 90)} seconds",
            "platform": platform
        }

    # ── GENERATE POST SCRIPT ──────────────────────────────────────
    try:
        raw_post = invoke_with_fallback([HumanMessage(content=post_script_prompt)])
        print(f"[DEBUG] Raw post script (first 300): {raw_post[:300]}")

        post_scripts = extract_json_robust(raw_post, is_array=True)
        print(f"[DEBUG] Parsed post_scripts count: {len(post_scripts) if isinstance(post_scripts, list) else 'NOT LIST'}")
        print(f"[DEBUG] post_scripts content: {post_scripts}")

        if not isinstance(post_scripts, list) or not post_scripts:
            raise ValueError(f"post_scripts parsed as empty or wrong type: {type(post_scripts)}")

        # Ensure all values are strings
        for item in post_scripts:
            if isinstance(item, dict):
                for k, v in item.items():
                    item[k] = str(v)

        state["post_scripts"] = post_scripts
        print(f"[DEBUG] post_scripts set in state — headline: {post_scripts[0].get('headline', '')[:80]}")

    except Exception as e:
        print(f"[ERROR] Post script failed: {e}")
        state["errors"] = state.get("errors", []) + [f"Post script failed: {str(e)}"]
        state["post_scripts"] = [{
            "slide_number": 1,
            "role": "single_post",
            "headline": f"Discover {brand_name}",
            "body": f"Built for {target_audience}. {topic}.",
            "cta": cta_goal,
            "image_prompt": f"Advertisement poster for {brand_name}"
        }]

    # ── BACKWARD COMPAT ───────────────────────────────────────────
    video_script = state.get("video_script", {})
    state["scripts"] = [{
        "duration": str(video_script.get("duration", "30s")),
        "hook": str(video_script.get("hook", "")),
        "value": str(video_script.get("value", "")),
        "cta": str(video_script.get("cta", "")),
        "full_script": str(video_script.get("full_script", ""))
    }]

    return state
