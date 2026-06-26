import json
from app.models.state import ContentForgeState
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage

TWEET_STYLES = {
    "Hot Take": {
        "purpose": "Generate engagement - Strong opinions - Contrarian viewpoints",
        "structure": "Hook -> Opinion -> Short justification",
        "requirements": "- Under 280 characters if possible\n- High clarity\n- No hashtags unless relevant\n- No emojis unless required\n- Strong opening line\n- Platform-native writing style"
    },
    "Question": {
        "purpose": "Increase comments - Gather audience insights",
        "structure": "Question -> Optional context -> Call for responses",
        "requirements": "- Open-ended question\n- Conversational tone\n- Clear and concise"
    },
    "Contrarian": {
        "purpose": "Challenge common beliefs",
        "structure": "Common belief -> Counter opinion -> Reasoning",
        "requirements": "- Thought-provoking\n- Backed by logic or personal experience"
    },
    "Mini Lesson": {
        "purpose": "Teach a concept quickly",
        "structure": "Topic -> Short explanation -> Key takeaway",
        "requirements": "- Educational\n- Easy to digest\n- High value density"
    },
    "Statistic": {
        "purpose": "Share data-driven insights",
        "structure": "Statistic -> Interpretation -> Conclusion",
        "requirements": "- Credible data\n- Clear interpretation\n- Actionable insight"
    },
    "Myth vs Reality": {
        "purpose": "Educational engagement",
        "structure": "Myth -> Reality -> Explanation",
        "requirements": "- Clear contrast\n- Informative"
    },
    "Build In Public": {
        "purpose": "Creator journey updates",
        "structure": "Current progress -> Achievements -> Next steps",
        "requirements": "- Authentic\n- Transparent\n- Milestones highlighted"
    },
    "Progress Update": {
        "purpose": "Product updates - Project milestones",
        "structure": "Completed tasks -> Results -> Future work",
        "requirements": "- Objective\n- Forward-looking"
    },
    "Behind The Scenes": {
        "purpose": "Share process insights",
        "structure": "Observation -> Challenge -> Lesson learned",
        "requirements": "- Relatable\n- Honest"
    },
    "Challenge": {
        "purpose": "Community participation",
        "structure": "Challenge -> Rules -> Invitation",
        "requirements": "- Engaging\n- Clear instructions"
    },
    "Prediction": {
        "purpose": "Future forecasting",
        "structure": "Prediction -> Reasoning -> Expected outcome",
        "requirements": "- Bold statement\n- Logical backing"
    },
    "Comparison": {
        "purpose": "Compare tools, frameworks, concepts",
        "structure": "A vs B -> Pros/Cons -> Recommendation",
        "requirements": "- Unbiased\n- Clear distinction"
    },
    "List": {
        "purpose": "Quick value delivery",
        "structure": "Title -> Numbered items -> Brief summary",
        "requirements": "- Scannable\n- Actionable items"
    },
    "Mistake": {
        "purpose": "Share lessons",
        "structure": "Common mistake -> Impact -> Correct approach",
        "requirements": "- Vulnerable\n- Constructive"
    },
    "Personal Experience": {
        "purpose": "Authentic storytelling",
        "structure": "Experience -> Learning -> Advice",
        "requirements": "- Story-driven\n- Relatable"
    },
    "News Reaction": {
        "purpose": "React to industry events",
        "structure": "News -> Analysis -> Opinion",
        "requirements": "- Timely\n- Insightful"
    },
    "Motivational": {
        "purpose": "Inspiration",
        "structure": "Observation -> Motivational statement",
        "requirements": "- Uplifting\n- Positive"
    },
    "One-Liner": {
        "purpose": "Highly shareable content",
        "structure": "Single impactful statement",
        "requirements": "- Punchy\n- Memorable\n- Very short"
    },
    "Thread Starter": {
        "purpose": "Begin a thread",
        "structure": "Hook -> Promise of value -> Thread indicator",
        "requirements": "- Compelling hook\n- Clear value proposition\n- Ends with 🧵"
    },
    "Debate": {
        "purpose": "Encourage discussion",
        "structure": "Topic -> Two options -> Question",
        "requirements": "- Polarizing topic\n- Neutral presentation of options\n- Clear question"
    }
}

AUTO_STYLES = ["Hot Take", "Mini Lesson", "Question", "Prediction", "List"]

async def twitter_strategy_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Determines how a tweet should be structured before content generation.
    """
    platform = state.get("platform", "").lower()
    if platform != "twitter":
        return state

    tweet_style = state.get("tweet_style")
    topic = state.get("topic", "")
    target_audience = state.get("target_audience", state.get("audience", ""))
    research = state.get("competitor_insights", "")

    if not tweet_style or tweet_style not in TWEET_STYLES:
        # Auto-select style based on research context
        prompt = f"""
        You are a Twitter/X strategy expert.
        Based on the following context, select the best tweet style from this list:
        {', '.join(AUTO_STYLES)}
        
        TOPIC: {topic}
        AUDIENCE: {target_audience}
        RESEARCH CONTEXT: {research}
        
        Return ONLY a JSON object with a single key "style" and the string value of the selected style.
        Example: {{"style": "Mini Lesson"}}
        """
        
        try:
            response = invoke_with_fallback([HumanMessage(content=prompt)])
            from app.agents.script_agent import extract_json_robust
            data = extract_json_robust(response, is_array=False)
            tweet_style = data.get("style", "Hot Take")
            if tweet_style not in AUTO_STYLES:
                tweet_style = "Hot Take"
        except Exception as e:
            print(f"[ERROR] Twitter strategy selection failed: {e}")
            tweet_style = "Hot Take"
            
    state["tweet_style"] = tweet_style
    
    style_config = TWEET_STYLES.get(tweet_style, TWEET_STYLES["Hot Take"])
    
    instructions = f"""
    Style: {tweet_style}
    Purpose: {style_config['purpose']}
    Structure: {style_config['structure']}
    Requirements:
    {style_config['requirements']}
    """
    
    state["twitter_instructions"] = instructions.strip()
    return state
