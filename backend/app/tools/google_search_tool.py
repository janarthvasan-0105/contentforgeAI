import httpx
from typing import List
from app.config import get_settings

settings = get_settings()


async def google_search(query: str, num_results: int = 10) -> List[dict]:
    """
    Use Serper.dev API for Google Search results.
    Returns list of {title, link, snippet} dicts.
    """
    headers = {
        "X-API-KEY": settings.serper_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "q": query,
        "num": num_results,
        "gl": "us",
        "hl": "en",
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://google.serper.dev/search",
                json=payload,
                headers=headers,
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
    except Exception as e:
        print(f"Warning: Google Search failed for '{query}': {e}")
        return []

    results = []
    for item in data.get("organic", []):
        results.append({
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", ""),
        })
    return results


async def get_trending_content(topic: str, platform: str) -> List[str]:
    """Search for trending content on a specific platform."""
    query = f"site:{platform}.com OR {platform} viral {topic} 2024 2025"
    results = await google_search(query, num_results=5)
    return [f"{r['title']} — {r['snippet']}" for r in results]
