from app.models.state import ContentState
from app.api.database import supabase
from app.config import get_settings
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from datetime import datetime
import os

# ── Clients ───────────────────────────────────────────────────────
settings = get_settings()

PINECONE_API_KEY = settings.pinecone_api_key
PINECONE_INDEX_NAME = settings.pinecone_index_name

# Load embedding model once at startup — runs locally, no API cost
_embedder = None
def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")  # 384 dimensions
    return _embedder


def get_pinecone_index():
    pc = Pinecone(api_key=PINECONE_API_KEY)
    return pc.Index(PINECONE_INDEX_NAME)


# ── Embedding Helper ──────────────────────────────────────────────
def build_embedding_text(state: dict) -> str:
    """
    Builds a rich text string from session data for embedding.
    The more descriptive this is, the better semantic search works.
    """
    parts = [
        f"Brand: {state.get('brand_name', '')}",
        f"Topic: {state.get('topic', '')}",
        f"Platform: {state.get('platform', '')}",
        f"Tone: {state.get('tone', '')}",
        f"Audience: {state.get('target_audience', '')}",
        f"Purpose: {state.get('purpose', 'general')}",
        f"CTA Goal: {state.get('cta_goal', '')}",
    ]

    # Add script content for richer semantic matching
    video_script = state.get("video_script", {})
    if video_script:
        parts.append(f"Hook: {video_script.get('hook', '')}")
        parts.append(f"Value: {video_script.get('value', '')}")
        parts.append(f"CTA: {video_script.get('cta', '')}")

    post_scripts = state.get("post_scripts", [])
    if post_scripts:
        first = post_scripts[0]
        parts.append(f"Post headline: {first.get('headline', '')}")
        parts.append(f"Post body: {first.get('body', '')}")

    # Add app context if available
    app_context = state.get("app_context", {})
    if app_context:
        parts.append(f"App description: {app_context.get('description', '')}")
        features = app_context.get("key_features", [])
        if features:
            parts.append(f"Features: {', '.join(features[:3])}")

    return " | ".join(filter(None, parts))


# ── Memory Retrieval Agent ─────────────────────────────────────────
async def memory_retrieval_agent(state: ContentState) -> ContentState:
    """
    Retrieves semantically similar past sessions from Pinecone.
    Also fetches exact user preferences from MongoDB.
    Injects both as context for downstream agents.
    """
    user_id = state.get("user_id", "anonymous")
    brand_name = state.get("brand_name", "")
    topic = state.get("topic", "")
    platform = state.get("platform", "")
    tone = state.get("tone", "")
    target_audience = state.get("target_audience", "")

    memory_context = ""
    previous_scripts = []
    user_preferences = {}

    # ── Step 1: Semantic search via Pinecone ──────────────────────
    try:
        embedder = get_embedder()
        index = get_pinecone_index()

        # Build query text from current request
        query_text = " | ".join(filter(None, [
            f"Brand: {brand_name}",
            f"Topic: {topic}",
            f"Platform: {platform}",
            f"Tone: {tone}",
            f"Audience: {target_audience}"
        ]))

        # Embed the query
        query_vector = embedder.encode(query_text).tolist()

        # Search Pinecone for top 3 similar past sessions
        results = index.query(
            vector=query_vector,
            top_k=3,
            filter={"user_id": {"$eq": user_id}},
            include_metadata=True
        )

        matches = results.get("matches", [])

        if matches:
            memory_context = f"Found {len(matches)} semantically similar past session(s):\n"
            for match in matches:
                meta = match.get("metadata", {})
                score = round(match.get("score", 0), 2)
                memory_context += (
                    f"- [{score} similarity] "
                    f"Brand: {meta.get('brand_name', '')} | "
                    f"Topic: {meta.get('topic', '')} | "
                    f"Platform: {meta.get('platform', '')} | "
                    f"Tone: {meta.get('tone', '')} | "
                    f"Hook: {meta.get('hook', '')}\n"
                )

            # Pull previous scripts from metadata for style reference
            previous_scripts = [
                {
                    "hook": m.get("metadata", {}).get("hook", ""),
                    "value": m.get("metadata", {}).get("value", ""),
                    "cta": m.get("metadata", {}).get("cta", ""),
                    "platform": m.get("metadata", {}).get("platform", ""),
                    "tone": m.get("metadata", {}).get("tone", ""),
                    "similarity_score": round(m.get("score", 0), 2)
                }
                for m in matches
            ]

    except Exception as e:
        memory_context = f"Pinecone retrieval failed: {str(e)}\n"

    # ── Step 2: Exact preference lookup via Supabase ───────────────
    try:
        if supabase:
            res = supabase.table("sessions").select("*").eq("user_id", user_id).eq("brand_name", brand_name).order("created_at", desc=True).limit(1).execute()
            latest_session = res.data[0] if res.data else None

            if latest_session:
                user_preferences = {
                    "preferred_tone": latest_session.get("tone", ""),
                    "preferred_platform": latest_session.get("platform", ""),
                    "brand_colors": latest_session.get("brand_colors", []),
                    "image_style": latest_session.get("image_style", ""),
                    "last_cta_goal": latest_session.get("cta_goal", ""),
                    "last_generated_at": str(latest_session.get("created_at", ""))
                }
                memory_context += f"Last session for {brand_name}: {latest_session.get('created_at', '')}\n"

    except Exception as e:
        memory_context += f"Supabase retrieval failed: {str(e)}\n"

    return {
        **state,
        "memory_context": memory_context,
        "previous_scripts": previous_scripts,
        "user_preferences": user_preferences,
        "status": "memory_retrieved"
    }


# ── Memory Storage Agent ───────────────────────────────────────────
async def memory_storage_agent(state: ContentState) -> ContentState:
    """
    Saves the completed session to both MongoDB and Pinecone.
    MongoDB: full session document for history and exact lookup.
    Pinecone: vector embedding for semantic similarity search.
    """
    session_id = state.get("session_id", "")
    user_id = state.get("user_id", "anonymous")
    brand_name = state.get("brand_name", "")
    platform = state.get("platform", "")
    tone = state.get("tone", "")
    video_script = state.get("video_script", {})

    # ── Step 1: Save full document to Supabase ─────────────────────
    try:
        if supabase:
            session_data = {
                # Research outputs
                "trends": state.get("trends", []),
                "pain_points": state.get("pain_points", []),
                "interests": state.get("interests", []),

                # Script outputs
                "video_script": video_script,
                "post_scripts": state.get("post_scripts", []),
                "tutorial_script": state.get("tutorial_script", {}),
                "twitter_scripts": state.get("twitter_scripts", {}),
                "scripts": state.get("scripts", []),
                "captions": state.get("captions", {}),
                "hashtags": state.get("hashtags", {}),

                # Prompt outputs
                "video_prompt": state.get("video_prompt", ""),
                "image_prompts": state.get("image_prompts", []),
                "carousel_image_prompts": state.get("carousel_image_prompts", []),
                "twitter_grid_prompts": state.get("twitter_grid_prompts", []),

                # Generated media
                "generated_images": state.get("generated_images", []),
                "generated_video": state.get("generated_video", {}),
                "language_videos": state.get("language_videos", {}),
                "rendered_post_urls": state.get("rendered_post_urls", []),

                # Calendar
                "calendar_7day": state.get("calendar_7day", []),
                "calendar_30day": state.get("calendar_30day", []),
                "app_context": state.get("app_context", {}),
                "languages": state.get("languages", []),

                # Pipeline status
                "image_generation_success": state.get("image_generation_success", False),
                "video_generation_success": state.get("video_generation_success", False),
                "errors": state.get("errors", []),
                "status": "completed"
            }

            session_doc = {
                "session_id": session_id,
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "brand_name": brand_name,
                "platform": platform,
                "tone": tone,
                "cta_goal": state.get("cta_goal", ""),
                "image_style": state.get("image_style", ""),
                "session_data": session_data
            }

            supabase.table("sessions").upsert(session_doc).execute()

    except Exception as e:
        print(f"Supabase storage failed: {str(e)}")

    # ── Step 2: Save vector embedding to Pinecone ─────────────────
    try:
        embedder = get_embedder()
        index = get_pinecone_index()

        # Build embedding text from session
        embedding_text = build_embedding_text(state)

        # Generate vector
        vector = embedder.encode(embedding_text).tolist()

        # Metadata stored alongside vector in Pinecone
        # Keep this lightweight — only what's needed for memory_context display
        pinecone_metadata = {
            "user_id": user_id,
            "session_id": session_id,
            "brand_name": brand_name,
            "topic": state.get("topic", ""),
            "platform": platform,
            "tone": tone,
            "target_audience": state.get("target_audience", ""),
            "purpose": state.get("purpose", "general"),
            "post_type": state.get("post_type", "single_post"),
            "tweet_style": state.get("tweet_style"),
            "hook": video_script.get("hook", "")[:200],   # truncate for metadata limit
            "value": video_script.get("value", "")[:200],
            "cta": video_script.get("cta", "")[:100],
            "image_style": state.get("image_style", ""),
            "created_at": datetime.utcnow().isoformat()
        }

        # Upsert vector — session_id as the vector ID
        index.upsert(vectors=[{
            "id": session_id,
            "values": vector,
            "metadata": pinecone_metadata
        }])

    except Exception as e:
        print(f"Pinecone storage failed: {str(e)}")

    return {**state, "status": "memory_stored"}
