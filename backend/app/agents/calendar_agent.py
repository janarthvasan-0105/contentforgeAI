from app.models.state import ContentState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re
from datetime import datetime



def extract_json(text: str) -> dict:
    match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if match:
        text = match.group(1)
    try:
        return json.loads(text.strip())
    except Exception:
        return {}


def get_next_7_days() -> list[str]:
    today = datetime.now()
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return [days[(today.weekday() + i) % 7] for i in range(7)]


async def calendar_agent(state: ContentState) -> ContentState:
    reel_ideas = state.get("reel_ideas", [])[:3]
    carousel_ideas = state.get("carousel_ideas", [])[:2]
    post_ideas = state.get("post_ideas", [])[:2]
    days_7 = get_next_7_days()

    prompt = f"""
    You are a social media content calendar planner for {state['platform']}.

    Topic: {state['topic']}
    Platform: {state['platform']}
    Available Content:
    - Reel ideas: {reel_ideas}
    - Carousel ideas: {carousel_ideas}
    - Post ideas: {post_ideas}
    - Best posting time: {state.get('content_direction', {}).get('posting_time', '6-9 PM')}
    Next 7 days: {days_7}

    Create a 7-day and 30-day content calendar. Return ONLY valid JSON:
    {{
      "calendar_7day": [
        {{
          "day": "Monday",
          "day_number": 1,
          "content_type": "Reel",
          "content_idea": "Specific idea for this day",
          "caption_style": "educational",
          "posting_time": "7:00 PM",
          "notes": "Use trending audio"
        }}
      ],
      "calendar_30day": [
        {{
          "week": 1,
          "theme": "Awareness & Hook",
          "content_plan": ["Mon: Reel - intro hook", "Wed: Carousel - tips", "Fri: Post - story"],
          "goal": "Build audience awareness"
        }},
        {{
          "week": 2,
          "theme": "Value & Education",
          "content_plan": ["Mon: Reel - tutorial", "Thu: Carousel - tools list", "Sat: Post - FAQ"],
          "goal": "Establish authority"
        }},
        {{
          "week": 3,
          "theme": "Engagement & Community",
          "content_plan": ["Tue: Reel - challenge", "Thu: Carousel - comparison", "Sun: Post - poll"],
          "goal": "Drive engagement"
        }},
        {{
          "week": 4,
          "theme": "Conversion & CTA",
          "content_plan": ["Mon: Reel - results", "Wed: Carousel - roadmap", "Fri: Post - offer"],
          "goal": "Convert followers to action"
        }}
      ]
    }}
    """

    result_text = invoke_with_fallback([
        SystemMessage(content="You are an expert social media manager. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    parsed = extract_json(result_text)

    return {
        **state,
        "calendar_7day": parsed.get("calendar_7day", []),
        "calendar_30day": parsed.get("calendar_30day", []),
        "status": "calendar_generated",
    }
