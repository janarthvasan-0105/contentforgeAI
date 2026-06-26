from app.models.state import ContentState
from app.render.playwright_renderer import render_html_to_png
import os
from app.config import get_settings

settings = get_settings()


async def playwright_render_agent(state: ContentState) -> ContentState:
    return state
    """Render every composed HTML post into a PNG file and return URLs."""
    if not state.get("use_playwright_fallback"):
        return state
        
    paths = []
    urls = []

    for idx, item in enumerate(state.get("composed_html_posts", [])):
        try:
            path = await render_html_to_png(item["html"], filename=f"post_{idx + 1}.png")
            paths.append(path)
            urls.append(f"{settings.app_base_url}/rendered/{os.path.basename(path)}")
        except Exception as e:
            # If rendering fails, still include the source image URL
            paths.append("")
            source_url = item.get("image_url", "")
            urls.append(source_url)
            print(f"Warning: Playwright render failed for post {idx + 1}: {e}")

    return {
        **state,
        "rendered_post_paths": paths,
        "rendered_post_urls": urls,
        "status": "render_complete",
    }
