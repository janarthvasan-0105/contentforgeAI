import os
import re
import requests
import cssutils
import logging
import httpx
import asyncio
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

# Suppress cssutils warnings
cssutils.log.setLevel(logging.CRITICAL)

SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", 30)) * 1000  # ms
MAX_CHARS = int(os.getenv("MAX_SCRAPE_CHARS", 15000))
LOGO_OUTPUT_DIR = "outputs/logos"


# ── Existing text scraping (keep unchanged) ────────────────────────

def _parse_html_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "iframe", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    cleaned = "\n".join(lines)
    return cleaned[:MAX_CHARS]


def _scrape_url_sync(url: str) -> str:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = httpx.get(url, headers=headers, follow_redirects=True, timeout=10.0)
        if response.status_code == 200 and len(response.text) > 2000:
            return _parse_html_content(response.text)
    except Exception as e:
        print(f"HTTP GET scrape failed for {url} in scraper_service: {e}")

    # Fallback to Playwright
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=SCRAPER_TIMEOUT, wait_until="domcontentloaded")
            html = page.content()
            browser.close()
            return _parse_html_content(html)
        except Exception as e:
            return f"Scrape failed: {str(e)}"


async def scrape_url(url: str) -> str:
    """
    Scrape a URL using Playwright in a background thread.
    Returns extracted text content.
    """
    return await asyncio.to_thread(_scrape_url_sync, url)


def parse_file_content(content: str) -> str:
    """
    Clean and truncate user-provided file/text content.
    """
    lines = [l.strip() for l in content.splitlines() if l.strip()]
    return "\n".join(lines)[:MAX_CHARS]


# ── NEW: Brand Identity Extraction ────────────────────────────────

async def extract_brand_identity(url: str, brand_name: str) -> dict:
    """
    Scrapes a website and extracts complete brand identity:
    logo URL, brand colors, font family, tagline.
    Returns brand_identity dict.
    """
    identity = {
        "logo_url": "",
        "logo_local_path": "",
        "logo_format": "",
        "primary_color": "",
        "secondary_color": "",
        "accent_color": "",
        "button_color": "",
        "font_family": "",
        "tagline": "",
        "brand_tone_words": [],
        "logo_compositing": False
    }

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = httpx.get(url, headers=headers, follow_redirects=True, timeout=15.0)
        if response.status_code != 200:
            print(f"Brand identity: URL returned {response.status_code}")
            return identity

        html = response.text
        base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        soup = BeautifulSoup(html, "html.parser")

        # ── Step 1: Extract Logo URL ──────────────────────────
        logo_url = _extract_logo_url(soup, base_url)
        if logo_url:
            identity["logo_url"] = logo_url

        # ── Step 2: Extract CSS for Colors + Fonts ────────────
        css_texts = []

        # Inline style tags
        for style_tag in soup.find_all("style"):
            if style_tag.string:
                css_texts.append(style_tag.string)

        # External stylesheets (sync requests, fast timeout)
        for link_tag in soup.find_all("link", rel="stylesheet"):
            href = link_tag.get("href", "")
            if href:
                full_href = urljoin(base_url, href)
                try:
                    resp = requests.get(full_href, timeout=5)
                    if resp.status_code == 200:
                        css_texts.append(resp.text[:50000])
                except Exception:
                    pass

        full_css = "\n".join(css_texts)

        # Extract colors and fonts from CSS
        colors = _extract_colors_from_css(full_css)
        font = _extract_font_from_css(full_css)

        if len(colors) > 0:
            identity["primary_color"] = colors[0]
        if len(colors) > 1:
            identity["secondary_color"] = colors[1]
        if len(colors) > 2:
            identity["accent_color"] = colors[2]

        identity["button_color"] = _extract_button_color(soup, full_css)
        identity["font_family"] = font

        # ── Step 3: Extract Tagline ───────────────────────────
        identity["tagline"] = _extract_tagline(soup, brand_name)

        # ── Step 4: Brand tone words ──────────────────────────
        identity["brand_tone_words"] = _extract_tone_words(soup)

    except Exception as e:
        print(f"Brand identity extraction failed: {str(e)}")

    # ── Step 5: Download Logo File ────────────────────────────────
    if identity["logo_url"]:
        local_path, fmt = _download_logo(identity["logo_url"], brand_name)
        if local_path:
            identity["logo_local_path"] = local_path
            identity["logo_format"] = fmt
            identity["logo_compositing"] = True

    return identity


def _extract_logo_url(soup: BeautifulSoup, base_url: str) -> str:
    """
    Priority order for logo detection:
    1. <img> with "logo" in id/class/alt/src
    2. SVG img tags
    3. og:image meta tag
    4. <link rel="icon"> favicon
    """
    logo_keywords = ["logo", "brand", "site-logo", "company-logo", "navbar-brand"]
    for img in soup.find_all("img"):
        attrs = " ".join([
            img.get("id", ""),
            img.get("class", [""])[0] if img.get("class") else "",
            img.get("alt", ""),
            img.get("src", "")
        ]).lower()
        if any(kw in attrs for kw in logo_keywords):
            src = img.get("src", "")
            if src:
                return urljoin(base_url, src)

    # Priority 2: SVG logo
    for svg_use in soup.find_all("img", src=re.compile(r"\.svg", re.I)):
        src = svg_use.get("src", "")
        if src:
            return urljoin(base_url, src)

    # Priority 3: og:image
    og_image = soup.find("meta", property="og:image")
    if og_image:
        content = og_image.get("content", "")
        if content:
            return urljoin(base_url, content)

    # Priority 4: favicon
    favicon = soup.find("link", rel=re.compile(r"icon", re.I))
    if favicon:
        href = favicon.get("href", "")
        if href:
            return urljoin(base_url, href)

    return ""


def _extract_colors_from_css(css_text: str) -> list:
    """
    Extracts hex colors from CSS.
    Priority: CSS variables → most frequent non-neutral colors.
    Returns top 3 brand colors.
    """
    colors = []

    # Extract CSS variable colors first (most reliable)
    var_pattern = re.compile(
        r'--(?:primary|brand|main|accent|theme|color)[^:]*:\s*(#[0-9a-fA-F]{3,6})',
        re.IGNORECASE
    )
    var_colors = var_pattern.findall(css_text)
    colors.extend(var_colors)

    # Extract all hex colors
    all_hex = re.findall(r'#([0-9a-fA-F]{6})', css_text)

    # Filter out neutral colors
    brand_colors = []
    seen = set()
    for hex_code in all_hex:
        full = f"#{hex_code.upper()}"
        if full in seen:
            continue
        seen.add(full)

        r = int(hex_code[0:2], 16)
        g = int(hex_code[2:4], 16)
        b = int(hex_code[4:6], 16)

        is_near_white = r > 230 and g > 230 and b > 230
        is_near_black = r < 30 and g < 30 and b < 30
        is_grey = abs(r - g) < 20 and abs(g - b) < 20 and abs(r - b) < 20

        if not is_near_white and not is_near_black and not is_grey:
            brand_colors.append(full)

    # Combine: CSS var colors first, then brand colors
    final = []
    seen_final = set()
    for c in colors + brand_colors:
        if c not in seen_final:
            seen_final.add(c)
            final.append(c)

    return final[:3]


def _extract_button_color(soup: BeautifulSoup, css_text: str) -> str:
    """
    Extracts the primary CTA button color.
    """
    button_pattern = re.compile(
        r'(?:\.btn|\.button|\.cta|button)[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})',
        re.IGNORECASE
    )
    matches = button_pattern.findall(css_text)
    if matches:
        return matches[0]

    # Fallback: look for inline style on button elements
    for btn in soup.find_all(["button", "a"], class_=re.compile(r"btn|cta|primary", re.I)):
        style = btn.get("style", "")
        color_match = re.search(r'background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})', style)
        if color_match:
            return color_match.group(1)

    return ""


def _extract_font_from_css(css_text: str) -> str:
    """
    Extracts primary font family from CSS.
    """
    var_font = re.search(
        r'--(?:font|typeface|body-font)[^:]*:\s*([^;]+);',
        css_text, re.IGNORECASE
    )
    if var_font:
        return var_font.group(1).strip().strip("'\"")

    body_font = re.search(
        r'(?:body|:root|html)\s*\{[^}]*font-family:\s*([^;]+);',
        css_text, re.IGNORECASE
    )
    if body_font:
        fonts = body_font.group(1).strip()
        first_font = fonts.split(",")[0].strip().strip("'\"")
        return first_font

    return ""


def _extract_tagline(soup: BeautifulSoup, brand_name: str) -> str:
    """
    Extracts brand tagline from meta description or hero heading.
    """
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        content = meta_desc.get("content", "")
        if content and len(content) < 150:
            return content.strip()

    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        content = og_desc.get("content", "")
        if content and len(content) < 150:
            return content.strip()

    for tag in soup.find_all(["h1", "h2"], limit=5):
        text = tag.get_text(strip=True)
        if text and brand_name.lower() not in text.lower() and len(text) < 100:
            return text

    return ""


def _extract_tone_words(soup: BeautifulSoup) -> list:
    """
    Extracts brand tone words from headings and meta keywords.
    """
    tone_indicators = [
        "simple", "fast", "smart", "trusted", "verified", "free",
        "premium", "modern", "instant", "easy", "secure", "reliable",
        "affordable", "professional", "innovative", "seamless"
    ]

    found = []
    all_text = soup.get_text().lower()
    for word in tone_indicators:
        if word in all_text:
            found.append(word)

    return found[:5]


def _download_logo(logo_url: str, brand_name: str) -> tuple:
    """
    Downloads logo from URL and saves locally.
    Converts SVG to PNG if needed.
    Returns (local_path, format) or ("", "") on failure.
    """
    os.makedirs(LOGO_OUTPUT_DIR, exist_ok=True)

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(logo_url, timeout=10, headers=headers)

        if response.status_code != 200:
            return "", ""

        content_type = response.headers.get("content-type", "")
        ext = "png"

        if "svg" in content_type or logo_url.endswith(".svg"):
            try:
                import cairosvg
                safe_name = brand_name.lower().replace(" ", "_")
                output_path = f"{LOGO_OUTPUT_DIR}/{safe_name}_logo.png"
                cairosvg.svg2png(
                    bytestring=response.content,
                    write_to=output_path,
                    output_width=200,
                    output_height=200
                )
                return output_path, "png"
            except Exception as e:
                print(f"SVG conversion failed: {e}")
                return "", ""

        elif "png" in content_type or logo_url.endswith(".png"):
            ext = "png"
        elif "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"
        elif "ico" in content_type or logo_url.endswith(".ico"):
            ext = "ico"

        safe_name = brand_name.lower().replace(" ", "_")
        output_path = f"{LOGO_OUTPUT_DIR}/{safe_name}_logo.{ext}"

        img = Image.open(BytesIO(response.content))

        if ext == "ico":
            output_path = output_path.replace(".ico", ".png")
            img.save(output_path, "PNG")
            return output_path, "png"

        if img.mode not in ("RGBA", "RGB"):
            img = img.convert("RGBA")

        img.save(output_path)
        return output_path, ext

    except Exception as e:
        print(f"Logo download failed: {str(e)}")
        return "", ""
