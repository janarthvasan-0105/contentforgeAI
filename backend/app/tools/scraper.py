import asyncio
from bs4 import BeautifulSoup
from typing import Optional
import httpx
from app.config import get_settings

settings = get_settings()


def _sync_scrape_http(url: str) -> str:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = httpx.get(url, headers=headers, follow_redirects=True, timeout=10.0)
        if response.status_code == 200:
            return response.text
    except Exception as e:
        print(f"HTTP GET scrape failed for {url}: {e}")
    return ""


def _sync_scrape_playwright(url: str, wait_for: Optional[str] = None) -> str:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(url, timeout=15000, wait_until="domcontentloaded")
            if wait_for:
                page.wait_for_selector(wait_for, timeout=5000)
            return page.content()
        except Exception as e:
            return f"Playwright scrape failed: {str(e)}"
        finally:
            browser.close()


async def scrape_url(url: str, wait_for: Optional[str] = None) -> str:
    """
    Scrapes a URL. First tries HTTP GET (fast & robust),
    and falls back to sync Playwright run in a thread if HTTP returns empty/fails.
    """
    html = await asyncio.to_thread(_sync_scrape_http, url)
    
    if not html or len(html) < 2000:
        print(f"HTTP content empty or too short for {url}, falling back to Playwright...")
        try:
            html = await asyncio.to_thread(_sync_scrape_playwright, url, wait_for)
        except Exception as e:
            return f"Scraping failed for {url}: {str(e)}"
            
    if not html or html.startswith("Playwright scrape failed"):
        return f"Scraping failed for {url}: {html}"
        
    return parse_html(html)


def parse_html(html: str) -> str:
    """Extract clean text from HTML using BeautifulSoup."""
    soup = BeautifulSoup(html, "html.parser")
    # Remove noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()
    # Get article or main content if available
    main = soup.find("article") or soup.find("main") or soup.find("body")
    if not main:
        return ""
    text = main.get_text(separator="\n", strip=True)
    # Collapse whitespace
    lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 30]
    return "\n".join(lines[:100])  # Cap at 100 lines per page


async def scrape_multiple(urls: list[str]) -> list[str]:
    """Scrape multiple URLs concurrently using threadpool."""
    tasks = [scrape_url(url) for url in urls[:5]]  # Limit to 5 concurrent
    return await asyncio.gather(*tasks, return_exceptions=True)
