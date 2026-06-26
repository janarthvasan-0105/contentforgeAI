from app.models.state import ContentState
from app.tools.reddit_tool import search_reddit, extract_reddit_insights
from app.tools.google_search_tool import google_search, get_trending_content
from app.tools.scraper import scrape_multiple
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re



def extract_json(text: str) -> dict:
    match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if match:
        text = match.group(1)
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return {}


async def research_agent(state: ContentState) -> ContentState:
    topic = state["topic"]
    platform = state["platform"]

    # 1. Reddit research (public JSON API — no key needed)
    reddit_posts = await search_reddit(topic)
    reddit_insights = extract_reddit_insights(reddit_posts)

    # 2. Google Search
    search_results = await google_search(f"{topic} {platform} trends 2025")
    trending = await get_trending_content(topic, platform)

    # 3. Scrape top 3 blog results
    urls = [r["link"] for r in search_results[:3]]
    scraped_texts = await scrape_multiple(urls)
    scraped_content = "\n---\n".join(
        [t for t in scraped_texts if isinstance(t, str) and len(t) > 100]
    )

    # 4. Synthesize with Gemini
    research_summary = f"""
    Reddit trending titles: {reddit_insights['trending_titles']}
    High engagement posts: {reddit_insights['high_engagement_posts']}
    Google snippets: {[r['snippet'] for r in search_results[:5]]}
    Blog content: {scraped_content[:3000]}
    Trending on {platform}: {trending}
    """

    prompt = f"""
    You are a research analyst. Analyze this research data about "{topic}" for {platform}.

    Research Data:
    {research_summary}

    Extract and return ONLY valid JSON:
    {{
      "trends": ["trend1", "trend2", "trend3", "trend4", "trend5"],
      "questions": ["question1", "question2", "question3", "question4", "question5"],
      "competitors": ["competitor_content_1", "competitor_content_2", "competitor_content_3"]
    }}
    """

    result_text = invoke_with_fallback([
        SystemMessage(content="You are a data analyst. Return only valid JSON."),
        HumanMessage(content=prompt),
    ])

    parsed = extract_json(result_text)

    return {
        **state,
        "trends": parsed.get("trends", []),
        "questions": parsed.get("questions", []),
        "competitors": parsed.get("competitors", []),
        "raw_research": research_summary[:5000],
        "status": "research_complete",
    }
