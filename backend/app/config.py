from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str = "contentforge"
    serper_api_key: str
    apify_api_token: str = ""
    hf_api_token: str = ""
    gemini_api: str = ""
    ideogram_api_key: str = ""
    gemini_api_key: str = ""
    gemini_video_model: str = "gemini-2.0-flash-exp"
    image_provider_primary: str = "pollinations"
    image_provider_fallback: str = "huggingface"

    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""  # From: Supabase Dashboard → Settings → API → JWT Secret
    
    app_base_url: str = "http://localhost:8000"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"
    google_api_key: str = ""
    runway_api_key: str = ""
    mongodb_uri: str = ""
    output_dir: str = ""
    fonts_dir: str = ""
    scraper_timeout: int = 30
    max_scrape_chars: int = 15000

    # Twitter
    twitter_username: Optional[str] = None
    twitter_password: Optional[str] = None

    # Veo Config
    veo_model: str = "veo-3.1-lite-generate-preview"
    veo_resolution: str = "720p"
    veo_duration: int = 8
    veo_max_poll_attempts: int = 40
    
    # Twitter Per-User
    token_encryption_key:      str = ""
    twitter_token_warning_day: int = 20
    twitter_token_block_day:   int = 30
    twitter_validate_url:      str = "https://api.twitter.com/1.1/account/verify_credentials.json"
    twitter_bearer_token:      str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()
