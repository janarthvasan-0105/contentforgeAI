import os
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

supabase: Client = None

if settings.supabase_url and settings.supabase_key:
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
