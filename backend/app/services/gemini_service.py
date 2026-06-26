import google.generativeai as genai
import os
from functools import lru_cache

@lru_cache(maxsize=1)
def get_gemini_client():
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    if not api_key:
        print("[WARNING] No GOOGLE_API_KEY or GEMINI_API_KEY found in environment")
    genai.configure(api_key=api_key)
    return genai

def get_text_model(model: str = "gemini-3.5-flash"):
    """For LLM/text generation agents"""
    client = get_gemini_client()
    return client.GenerativeModel(model)

def get_image_model():
    """For image generation agent"""
    client = get_gemini_client()
    return client.ImageGenerationModel(
        "imagen-4.0-generate-001" # Using updated model name per previous discovery
    )
