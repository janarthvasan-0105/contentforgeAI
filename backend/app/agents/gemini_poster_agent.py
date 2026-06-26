"""
Gemini Poster Agent — replaces the entire visual pipeline with a single
Gemini API call that generates complete branded social media posters.
"""
import os
import re
import uuid
from app.models.state import ContentState
from app.utils.llm import invoke_with_fallback
from app.providers.gemini_image_client import generate_poster
from app.config import get_settings
from langchain_core.messages import SystemMessage, HumanMessage

settings = get_settings()
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "render", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


async def gemini_poster_agent(state: ContentState) -> ContentState:
    """Generate complete branded posters using Gemini (Imagen 3)."""
    ideas = state.get("post_ideas") or [state["topic"]]
    brand_name = state.get("brand_name", "Brand")
    topic = state.get("topic", "")
    audience = state.get("audience", "")
    tone = state.get("tone", "professional")
    cta_goal = state.get("cta_goal", "downloads")
    brand_category = state.get("brand_category", "app")
    image_style = state.get("image_style", "realistic")

    poster_urls = []
    source_urls = []

    for idx, raw_idea in enumerate(ideas[:3]):
        # Clean up the idea text
        headline = re.sub(
            r'^(?:Post idea \d+:\s*|\d+\.\s*|[\'"])+',
            '', raw_idea, flags=re.IGNORECASE
        )
        headline = re.sub(r'[\'"]+$', '', headline)
        if ' - ' in headline:
            headline = headline.split(' - ')[0]
        headline = headline.strip()

        # Use Gemini (text) to craft the perfect poster prompt
        prompt_request = f"""
You are a professional social media poster designer. Create a detailed image generation prompt for a branded social media poster.

Brand: {brand_name}
Topic: {topic}
Headline for this post: {headline}
Audience: {audience}
Tone: {tone}
CTA Goal: {cta_goal}
Brand Category: {brand_category}
Image Style: {image_style}

The poster MUST look like a professional social media ad with:
- A realistic, high-quality background scene with real people or objects related to the topic
- The brand name "{brand_name}" displayed cleanly in the top-left corner
- A bold, attention-grabbing headline text overlaid on the image
- A short subtitle or tagline beneath the headline
- A Call-to-Action button (e.g., "Get Started", "Learn More", "Download Now")
- A branded hashtag in the bottom-right corner
- Modern typography with clean, readable fonts
- Professional color grading and composition
- Square format (1:1 aspect ratio) optimized for Instagram/social media

Return ONLY the image generation prompt text, nothing else. No JSON, no explanation. Just the prompt.
"""
        poster_prompt = invoke_with_fallback([
            SystemMessage(content="You write detailed, photorealistic image generation prompts for branded social media posters. Return only the prompt text."),
            HumanMessage(content=prompt_request)
        ])

        poster_prompt = poster_prompt.strip().strip('"').strip("'")

        # Generate the poster using Gemini Imagen
        filename = f"post_{idx + 1}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        print(f"Generating poster {idx + 1} with Gemini...")
        success = await generate_poster(poster_prompt, output_path)

        if success:
            url = f"{settings.app_base_url}/rendered/{filename}"
            poster_urls.append(url)
            source_urls.append(url)
            print(f"Poster {idx + 1} generated successfully!")
        else:
            poster_urls.append("")
            source_urls.append("")
            print(f"Poster {idx + 1} generation failed.")

    return {
        **state,
        "source_image_urls": source_urls,
        "rendered_post_urls": poster_urls,
        "status": "render_complete",
    }
