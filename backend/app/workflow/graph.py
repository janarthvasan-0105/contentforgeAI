from langgraph.graph import StateGraph, START, END
from app.models.state import ContentForgeState

# ── Core agents ────────────────────────────────────────────────────────────────
from app.agents.research_agent import research_agent
from app.agents.audience_agent import audience_agent
from app.agents.strategy_agent import strategy_agent
from app.agents.idea_agent import idea_agent
from app.agents.caption_agent import caption_agent
from app.agents.hashtag_agent import hashtag_agent
from app.agents.visual_concept_agent import visual_concept_agent
from app.agents.image_prompt_agent import image_prompt_agent
from app.agents.image_generation_agent import image_generation_agent
from app.agents.html_post_composer_agent import html_post_composer_agent
from app.agents.playwright_render_agent import playwright_render_agent
from app.agents.calendar_agent import calendar_agent
from app.agents.memory_agent import memory_retrieval_agent, memory_storage_agent

# ── Extended agents ────────────────────────────────────────────────────────────
from app.agents.scraper_agent import scraper_agent
from app.agents.script_agent import script_agent
from app.agents.tutorial_script_agent import tutorial_script_agent
from app.agents.carousel_prompt_agent import carousel_prompt_agent
from app.agents.twitter_strategy_agent import twitter_strategy_agent
from app.agents.field_detection_agent import field_detection_agent
from app.agents.format_picker_agent import format_picker_agent
from app.agents.compliance_agent import check_suggestion_compliance

# ── Video pipeline (Veo-only) ─────────────────────────────────────────────────
from app.agents.video_prompt_agent import video_prompt_agent
from app.agents.video_generation_agent import video_generation_agent
from app.agents.video_overlay_agent import video_overlay_agent


# ── Routing Functions ──────────────────────────────────────────────────────────

def route_after_script(state: ContentForgeState) -> str:
    """Route to tutorial agent for YouTube non-general content, else captions."""
    platform = state.get("platform", "").lower()
    purpose  = state.get("purpose", "general")
    if platform == "youtube" and purpose != "general":
        return "tutorial_script_node"
    return "captions_node"


def route_after_compliance(state: ContentForgeState) -> str:
    """
    After compliance check, branch by format:
      - carousel       → carousel_prompt_agent → image_generation_agent
      - reel/video/etc → video_prompt_agent (Veo pipeline)
      - else           → image_generation_agent (standard poster)
      - needs_regen    → scripts_node (retry)
    """
    if state.get("needs_regeneration"):
        return "scripts_node"

    post_type  = state.get("post_type", "single_post")
    if post_type == "carousel":
        return "carousel_prompt_agent"

    format_val = state.get("selected_format", "").lower()
    if format_val in ["reel", "tiktok", "shorts", "video"] or post_type == "video":
        return "video_prompt_agent"

    return "image_generation_agent"


def route_after_image_generation(state: ContentForgeState) -> str:
    """After poster image generation, go to calendar or HTML fallback."""
    if state.get("image_generation_success"):
        return "calendar_node"
    return "html_post_composer_agent"


def route_after_video_generation(state: ContentForgeState) -> str:
    """After Veo, apply overlays+voiceover; if failed skip to calendar."""
    if state.get("video_generation_success"):
        return "video_overlay_agent"
    return "calendar_node"


def route_after_strategy(state: ContentForgeState) -> str:
    """Route to Twitter strategy agent if platform is Twitter."""
    platform = state.get("platform", "").lower()
    if platform == "twitter":
        return "twitter_strategy_node"
    return "ideas_node"


# ── Graph Builder ──────────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    graph = StateGraph(ContentForgeState)

    # ── Register nodes ────────────────────────────────────────────────────────
    graph.add_node("scraper_node",              scraper_agent)
    graph.add_node("research_node",             research_agent)
    graph.add_node("audience_node",             audience_agent)
    graph.add_node("memory_retrieval_node",     memory_retrieval_agent)
    graph.add_node("strategy_node",             strategy_agent)
    graph.add_node("twitter_strategy_node",     twitter_strategy_agent)
    graph.add_node("ideas_node",                idea_agent)
    graph.add_node("field_detection",           field_detection_agent)
    graph.add_node("format_picker",             format_picker_agent)
    graph.add_node("scripts_node",              script_agent)
    graph.add_node("tutorial_script_node",      tutorial_script_agent)
    graph.add_node("captions_node",             caption_agent)
    graph.add_node("hashtags_node",             hashtag_agent)
    graph.add_node("visual_concept_agent",      visual_concept_agent)
    graph.add_node("image_prompt_agent",        image_prompt_agent)
    graph.add_node("compliance_check",          check_suggestion_compliance)
    graph.add_node("carousel_prompt_agent",     carousel_prompt_agent)
    graph.add_node("image_generation_agent",    image_generation_agent)
    graph.add_node("html_post_composer_agent",  html_post_composer_agent)
    graph.add_node("playwright_render_agent",   playwright_render_agent)

    # ── Veo video pipeline ────────────────────────────────────────────────────
    graph.add_node("video_prompt_agent",        video_prompt_agent)
    graph.add_node("video_generation_agent",    video_generation_agent)
    graph.add_node("video_overlay_agent",       video_overlay_agent)

    # ── Shared tail ───────────────────────────────────────────────────────────
    graph.add_node("calendar_node",             calendar_agent)
    graph.add_node("memory_storage_node",       memory_storage_agent)

    # ── Edges ─────────────────────────────────────────────────────────────────

    # Entry → scraper → research
    graph.add_edge(START,             "scraper_node")
    graph.add_edge("scraper_node",    "research_node")

    # Research → audience → memory → strategy
    graph.add_edge("research_node",         "audience_node")
    graph.add_edge("audience_node",         "memory_retrieval_node")
    graph.add_edge("memory_retrieval_node", "strategy_node")

    # Strategy branches (Twitter or general)
    graph.add_conditional_edges(
        "strategy_node",
        route_after_strategy,
        {
            "twitter_strategy_node": "twitter_strategy_node",
            "ideas_node":            "ideas_node",
        },
    )
    graph.add_edge("twitter_strategy_node", "ideas_node")

    # Ideas → field detection → format picker → scripts
    graph.add_edge("ideas_node",     "field_detection")
    graph.add_edge("field_detection", "format_picker")
    graph.add_edge("format_picker",  "scripts_node")

    # Script → tutorial or captions
    graph.add_conditional_edges(
        "scripts_node",
        route_after_script,
        {
            "tutorial_script_node": "tutorial_script_node",
            "captions_node":        "captions_node",
        },
    )
    graph.add_edge("tutorial_script_node", "captions_node")

    # Captions → hashtags → visual concept → image prompt → compliance
    graph.add_edge("captions_node",        "hashtags_node")
    graph.add_edge("hashtags_node",        "visual_concept_agent")
    graph.add_edge("visual_concept_agent", "image_prompt_agent")
    graph.add_edge("image_prompt_agent",   "compliance_check")

    # Compliance branches by format
    graph.add_conditional_edges(
        "compliance_check",
        route_after_compliance,
        {
            "carousel_prompt_agent":  "carousel_prompt_agent",
            "video_prompt_agent":     "video_prompt_agent",
            "image_generation_agent": "image_generation_agent",
            "scripts_node":           "scripts_node",
        },
    )

    # ── Image / carousel path ─────────────────────────────────────────────────
    graph.add_edge("carousel_prompt_agent", "image_generation_agent")

    graph.add_conditional_edges(
        "image_generation_agent",
        route_after_image_generation,
        {
            "calendar_node":           "calendar_node",
            "html_post_composer_agent": "html_post_composer_agent",
        },
    )
    graph.add_edge("html_post_composer_agent", "playwright_render_agent")
    graph.add_edge("playwright_render_agent",  "calendar_node")

    # ── Veo video path ────────────────────────────────────────────────────────
    # video_prompt_agent → video_generation_agent → (overlay or skip) → calendar
    graph.add_edge("video_prompt_agent", "video_generation_agent")

    graph.add_conditional_edges(
        "video_generation_agent",
        route_after_video_generation,
        {
            "video_overlay_agent": "video_overlay_agent",
            "calendar_node":       "calendar_node",
        },
    )
    graph.add_edge("video_overlay_agent", "calendar_node")

    # ── Shared tail ───────────────────────────────────────────────────────────
    graph.add_edge("calendar_node",       "memory_storage_node")
    graph.add_edge("memory_storage_node", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_workflow(initial_state: dict) -> dict:
    graph = get_graph()
    final_state = await graph.ainvoke(initial_state, {"recursion_limit": 50})
    return final_state
