from app.models.state import ContentState
import re


async def html_post_composer_agent(state: ContentState) -> ContentState:
    return state
    """Generate branded HTML/CSS post layouts combining AI image + text + CTA."""
    if not state.get("use_playwright_fallback"):
        return state
        
    composed = []

    # Get caption text for subheadline
    caption_text = ""
    if isinstance(state.get("captions"), dict):
        values = list(state.get("captions", {}).values())
        caption_text = values[0] if values else ""

    for idx, image_url in enumerate(state.get("source_image_urls", [])):
        ideas = state.get("post_ideas") or [state["topic"]]
        # Use specific idea for this post, or fallback to the first
        raw_headline = ideas[idx] if idx < len(ideas) else ideas[0]
        
        # Strip prefixes like "Post idea 1:" or "1." or quotes
        headline = re.sub(r'^(?:Post idea \d+:\s*|\d+\.\s*|[\'"])+', '', raw_headline, flags=re.IGNORECASE)
        headline = re.sub(r'[\'"]+$', '', headline)
        
        # Strip explanations after a dash
        if ' - ' in headline:
            headline = headline.split(' - ')[0]
        elif '- ' in headline:
            headline = headline.split('- ')[0]
            
        headline = headline.strip()
        subheadline = caption_text[:120] if caption_text else state["topic"]

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ width: 1080px; height: 1080px; font-family: 'Inter', sans-serif; background: #0f172a; }}
    .canvas {{ position: relative; width: 1080px; height: 1080px; overflow: hidden; background: linear-gradient(145deg, {state['brand_secondary_color']}, {state['brand_primary_color']}); }}
    .hero {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
    .overlay {{ position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.12)); }}
    .brand {{ position: absolute; top: 48px; left: 48px; background: rgba(255,255,255,0.14); color: white; padding: 14px 22px; border-radius: 999px; font-size: 28px; font-weight: 700; backdrop-filter: blur(12px); }}
    .content {{ position: absolute; left: 56px; right: 56px; bottom: 64px; color: white; }}
    .headline {{ font-size: 60px; line-height: 1.1; font-weight: 800; margin-bottom: 20px; max-width: 860px; text-wrap: balance; }}
    .subheadline {{ font-size: 32px; line-height: 1.35; color: rgba(255,255,255,0.9); max-width: 820px; margin-bottom: 28px; }}
    .cta {{ display: inline-block; background: white; color: {state['brand_secondary_color']}; padding: 16px 28px; border-radius: 999px; font-size: 28px; font-weight: 700; }}
  </style>
</head>
<body>
  <div class="canvas">
    <img src="{image_url}" class="hero" />
    <div class="overlay"></div>
    <div class="brand">{state['brand_name']}</div>
    <div class="content">
      <div class="headline">{headline}</div>
      <div class="subheadline">{subheadline}</div>
      <div class="cta">Get Started</div>
    </div>
  </div>
</body>
</html>"""

        composed.append({
            "index": idx,
            "html": html,
            "image_url": image_url,
            "headline": headline,
        })

    return {
        **state,
        "composed_html_posts": composed,
        "status": "html_posts_ready",
    }
