import json
from app.models.state import ContentForgeState
from app.services.scraper_service import scrape_url, parse_file_content, extract_brand_identity
from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage


async def scraper_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Runs only when purpose is 'app' or 'website'.
    Scrapes URL or parses uploaded file content.
    Populates state['app_context'] and state['brand_identity'].
    """
    purpose = state.get("purpose", "general")

    if purpose == "general":
        state["app_context"] = {}
        state["brand_identity"] = {}
        return state

    url = state.get("app_context_url")
    file_content = state.get("app_context_file_content")
    brand_name = state.get("brand_name", "Brand")

    if url:
        # Primary: scrape the URL for text content
        raw_content = await scrape_url(url)
        source = "url_scrape"

        # NEW: Extract brand identity from same URL
        try:
            brand_identity = await extract_brand_identity(url, brand_name)
            state["brand_identity"] = brand_identity
            print(f"[Brand Identity] Extracted: colors={brand_identity.get('primary_color')}, logo_compositing={brand_identity.get('logo_compositing')}")
        except Exception as e:
            print(f"[Brand Identity] Extraction failed (non-fatal): {e}")
            state["brand_identity"] = {}

    elif file_content:
        # Fallback: parse uploaded file content
        raw_content = parse_file_content(file_content)
        source = "file_upload"
        # No brand identity extraction for file uploads (no URL to scrape)
        state["brand_identity"] = {}
    else:
        state["app_context"] = {}
        state["brand_identity"] = {}
        state["errors"] = state.get("errors", []) + [
            "No URL or file provided for app/website purpose"
        ]
        return state

    # Use Groq to extract structured data from raw content
    extraction_prompt = f"""
    Extract structured information from the following app/website content.
    Return ONLY a valid JSON object with these exact keys:
    {{
        "app_name": "name of the app or website",
        "description": "main description in 2-3 sentences",
        "key_features": ["feature 1", "feature 2", "feature 3"],
        "target_users": "who this is for",
        "pricing": "pricing info or 'Free' if not mentioned",
        "reviews_summary": "summary of user reviews if available",
        "unique_selling_points": ["usp 1", "usp 2", "usp 3"]
    }}

    Content:
    {raw_content[:4000]}
    """

    try:
        response_text = invoke_with_fallback([HumanMessage(content=extraction_prompt)])
        text = response_text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        extracted = json.loads(text)
        extracted["source"] = source
        state["app_context"] = extracted
    except Exception as e:
        state["app_context"] = {
            "raw_content": raw_content[:5000],
            "source": source,
            "parse_error": str(e)
        }

    return state
