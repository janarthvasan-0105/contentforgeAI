import httpx
from typing import List


async def search_reddit(topic: str, limit: int = 15) -> List[dict]:
    """Scrape Reddit's public JSON endpoint — no API key needed."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    query = topic.replace(" ", "+")
    url = f"https://www.reddit.com/search.json?q={query}&sort=hot&limit={limit}&t=month"

    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            res = await client.get(url, timeout=15.0)
            res.raise_for_status()
            data = res.json()
    except Exception as e:
        print(f"Warning: Reddit search failed: {e}")
        return []

    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child.get("data", {})
        posts.append({
            "title": p.get("title", ""),
            "body": p.get("selftext", "")[:500],
            "score": p.get("score", 0),
            "subreddit": p.get("subreddit", ""),
            "num_comments": p.get("num_comments", 0),
        })

    # Sort by score
    posts.sort(key=lambda x: x["score"], reverse=True)
    return posts


def extract_reddit_insights(posts: List[dict]) -> dict:
    """
    Summarize Reddit posts into common questions, frustrations, and trending topics.
    Returns structured dict for the Research Agent.
    """
    titles = [p["title"] for p in posts]
    bodies = [p["body"] for p in posts if p["body"]]
    return {
        "trending_titles": titles[:10],
        "sample_discussions": bodies[:5],
        "high_engagement_posts": [p["title"] for p in posts if p["score"] > 100][:5],
    }
