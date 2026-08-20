from typing import TypedDict, Optional, List, Annotated
import operator


class ContentForgeState(TypedDict):
    # ── NEW: Purpose / Brand Category ──────────────────────
    purpose: Optional[str]          # "general" | "app" | "website"

    # ── NEW: App/Website Context ────────────────────────────
    app_context_url: Optional[str]          # URL pasted by user
    app_context_file_content: Optional[str] # content from uploaded file
    user_suggestion: Optional[str]          # custom user directives
    app_context: Optional[dict]             # extracted by scraper agent
    brand_identity: Optional[dict]          # extracted by scraper agent (logo, colors, fonts)
    logo_url: Optional[str]                 # User's uploaded logo url for watermarking

    # ── NEW: Compliance ─────────────────────────────────────
    compliance_passed: Optional[bool]
    compliance_reason: Optional[str]
    compliance_retry_count: Optional[int]
    needs_regeneration: Optional[bool]

    # ── NEW: Platform-specific video config ─────────────────
    video_config: Optional[dict]

    # ── NEW: Script outputs ─────────────────────────────────
    video_script: Optional[dict]
    tutorial_script: Optional[dict]     # YouTube + App/Website only
    post_scripts: Optional[List[dict]]

    # ── NEW: Prompt outputs ─────────────────────────────────
    video_prompt: Optional[str]         # cinematic frame-by-frame video prompt
    carousel_image_prompts: Optional[List[str]]  # 3 prompts for carousel
    twitter_scripts: Optional[dict]
    twitter_grid_prompts: Optional[List[str]]
    tweet_style: Optional[str]
    twitter_instructions: Optional[str]

    # ── NEW: Twitter Auto Publishing ────────────────────────
    poster_path: Optional[str]
    video_path: Optional[str]
    auto_publish: bool
    publish_status: Optional[str]
    tweet_url: Optional[str]

    # ── Input ──────────────────────────────────────────────
    brand_name: str
    brand_colors: List[str]
    topic: str
    target_audience: str
    languages: List[str]

    # ── NEW: Format Rotation fields ───────────────────────────────────────
    detected_field: str
    selected_format: str
    format_metadata: dict
    format_history: list[str]

    # ── Legacy input fields (kept for agent compatibility) ──
    platform: Optional[str]
    tone: Optional[str]
    user_id: Optional[str]
    post_type: Optional[str]
    cta_goal: Optional[str]
    brand_category: Optional[str]
    image_style: Optional[str]
    audience: Optional[str]             # legacy alias for target_audience
    brand_primary_color: Optional[str]
    brand_secondary_color: Optional[str]
    visual_style: Optional[str]

    # ── Legacy agent outputs ────────────────────────────────
    trends: Optional[List[str]]
    pain_points: Optional[List[str]]
    interests: Optional[List[str]]
    questions: Optional[List[str]]
    content_direction: Optional[dict]
    reel_ideas: Optional[List[str]]
    carousel_ideas: Optional[List[str]]
    post_ideas: Optional[List[str]]
    source_image_urls: Optional[List[str]]
    rendered_post_paths: Optional[List[str]]
    rendered_post_urls: Optional[List[str]]

    # ── Agent outputs ───────────────────────────────────────
    ideas: Optional[List[str]]
    competitor_insights: Optional[str]
    audience_profile: Optional[dict]
    scripts: Optional[List]             # List[ScriptOutput] or List[dict]
    captions: Optional[dict]
    hashtags: Optional[dict]            # ← was missing, caused silent failures
    visual_concepts: Optional[List[str]]
    image_prompts: Optional[List[str]]

    # ── Image output ────────────────────────────────────────
    generated_images: Optional[List[dict]]

    # ── Video output ────────────────────────────────────────
    generated_video: Optional[dict]
    language_videos: Optional[dict]
    voiceover_path: Optional[str]
    voiceover_script: Optional[str]
    video_text_overlays: Optional[List[dict]]
    
    # ── NEW: Pipeline-specific video fields ─────────────────
    video_scenes_schema: Optional[dict]
    video_keyframes: Optional[List[str]]
    interpolated_scenes: Optional[List[str]]

    # ── Pipeline control flags ──────────────────────────────
    image_generation_success: bool
    video_generation_success: bool
    use_playwright_fallback: bool

    # ── Calendar ────────────────────────────────────────────
    calendar_7day: Optional[List[dict]]
    calendar_30day: Optional[List[dict]]
    content_calendar: Optional[dict]

    # ── Session & errors ────────────────────────────────────
    session_id: str
    error: Optional[str]
    errors: Annotated[List[str], operator.add]
    status: str


# Alias for agents that import ContentState
ContentState = ContentForgeState