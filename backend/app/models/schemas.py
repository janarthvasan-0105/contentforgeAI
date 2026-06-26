from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class Platform(str, Enum):
    instagram = "instagram"
    youtube = "youtube"
    linkedin = "linkedin"
    twitter = "twitter"


class Tone(str, Enum):
    educational = "educational"
    funny = "funny"
    professional = "professional"
    storytelling = "storytelling"
    motivational = "motivational"


class GenerateRequest(BaseModel):
    # ── NEW fields ──
    purpose: str = "general"               # "general" | "app" | "website"
    app_context_url: Optional[str] = None  # URL to scrape
    app_context_file_content: Optional[str] = None  # pasted/uploaded text
    user_suggestion: Optional[str] = None          # custom directives / suggestions

    # ── EXISTING fields (keep all) ──
    topic: str = Field(..., min_length=2, max_length=200)
    platform: Platform
    audience: str = Field(..., min_length=2, max_length=500)
    tone: Optional[Tone] = None            # None = auto-select
    user_id: Optional[str] = "anonymous"
    brand_name: Optional[str] = "ContentForge"
    brand_primary_color: Optional[str] = "#0F766E"
    brand_secondary_color: Optional[str] = "#111827"
    visual_style: Optional[str] = "modern"
    post_type: Optional[str] = "single_post"
    tweet_style: Optional[str] = None
    cta_goal: Optional[str] = "downloads"
    image_style: Optional[str] = "realistic"
    languages: List[str] = ["english"]
    generate_video: bool = True
    video_duration: int = 5


class ScriptOutput(BaseModel):
    duration: str = "30s"
    hook: str = ""
    value: str = ""
    cta: str = ""
    full_script: str = ""


class ContentOutput(BaseModel):
    # ── Add these new fields ──
    video_script: dict = {}
    tutorial_script: dict = {}
    post_scripts: List[dict] = []
    video_prompt: str = ""
    carousel_image_prompts: List[str] = []
    app_context: dict = {}
    brand_identity: dict = {}
    twitter_scripts: dict = {}
    twitter_grid_prompts: List[str] = []

    # ── Keep ALL existing fields unchanged ──
    request_id: str
    topic: str = ""
    platform: str = ""
    trends: List[str] = []
    pain_points: List[str] = []
    interests: List[str] = []
    questions: List[str] = []
    content_direction: dict = {}
    reel_ideas: List[str] = []
    carousel_ideas: List[str] = []
    post_ideas: List[str] = []
    scripts: List[ScriptOutput] = []
    captions: dict = {}
    hashtags: dict = {}
    calendar_7day: List[dict] = []
    calendar_30day: List[dict] = []
    visual_concepts: List[dict] = []
    image_prompts: List[str] = []
    source_image_urls: List[str] = []
    rendered_post_urls: List[str] = []
    generated_images: List[dict] = []
    generated_video: dict = {}
    language_videos: dict = {}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)