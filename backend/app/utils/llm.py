from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage
from app.config import get_settings
import time

settings = get_settings()

# ── Primary: Groq ──
GROQ_FAST_MODEL = "llama-3.1-8b-instant"
GROQ_QUALITY_MODEL = "llama-3.3-70b-versatile"
GROQ_FALLBACK_MODELS = ["mixtral-8x7b-32768", "gemma2-9b-it"]


def get_fast_llm() -> ChatGroq:
    return ChatGroq(
        groq_api_key=settings.groq_api_key,
        model_name=GROQ_FAST_MODEL,
        temperature=0.7,
        max_tokens=4096,
    )


def get_quality_llm() -> ChatGroq:
    return ChatGroq(
        groq_api_key=settings.groq_api_key,
        model_name=GROQ_QUALITY_MODEL,
        temperature=0.7,
        max_tokens=8192,
    )


def invoke_with_fallback(messages: list[BaseMessage], quality: bool = False) -> str:
    """Use Groq models for all invocations with robust fallbacks and retries."""
    last_error = None

    groq_models = (
        [GROQ_QUALITY_MODEL, GROQ_FAST_MODEL]
        if quality
        else [GROQ_FAST_MODEL, GROQ_QUALITY_MODEL]
    )

    # Append fallbacks
    for fallback in GROQ_FALLBACK_MODELS:
        if fallback not in groq_models:
            groq_models.append(fallback)

    for model in groq_models:
        max_retries = 3
        backoff = 3.0  # seconds
        for attempt in range(max_retries):
            try:
                llm = ChatGroq(
                    groq_api_key=settings.groq_api_key,
                    model_name=model,
                    temperature=0.7,
                    max_tokens=8192 if model not in [GROQ_FAST_MODEL, "gemma2-9b-it"] else 4096,
                )
                response = llm.invoke(messages)
                return response.content
            except Exception as e:
                last_error = e
                err_msg = str(e).lower()
                print(f"Groq invocation failed on {model} (attempt {attempt+1}/{max_retries}): {e}")
                
                is_transient = (
                    "rate limit" in err_msg or 
                    "429" in err_msg or 
                    "413" in err_msg or 
                    "tpm" in err_msg or
                    "503" in err_msg or 
                    "unavailable" in err_msg or
                    "request too large" in err_msg
                )
                
                if is_transient and attempt < max_retries - 1:
                    time.sleep(backoff)
                    backoff *= 2.0  # Exponential backoff
                else:
                    break  # Move to next model

    raise Exception(f"All Groq invocations failed: {last_error}")
