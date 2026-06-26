from google import genai
from google.genai import types
from app.config import get_settings
from tenacity import retry, stop_after_attempt, wait_exponential

settings = get_settings()
client = genai.Client(api_key=settings.gemini_api_key)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def get_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model="text-embedding-004",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    return result.embeddings[0].values

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def get_query_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model="text-embedding-004",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    return result.embeddings[0].values
