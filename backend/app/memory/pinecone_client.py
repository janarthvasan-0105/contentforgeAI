from pinecone import Pinecone, ServerlessSpec
from app.config import get_settings
from app.utils.embeddings import get_embedding, get_query_embedding
from typing import Optional
import uuid
import time

settings = get_settings()


def get_pinecone_index():
    """Get or create the Pinecone index."""
    pc = Pinecone(api_key=settings.pinecone_api_key)

    # Create index if it doesn't exist
    existing = [idx.name for idx in pc.list_indexes()]
    if settings.pinecone_index_name not in existing:
        pc.create_index(
            name=settings.pinecone_index_name,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        # Wait for index to be ready
        time.sleep(5)

    return pc.Index(settings.pinecone_index_name)


def search_memory(
    query: str,
    user_id: str,
    top_k: int = 5,
    filter_platform: Optional[str] = None,
) -> list[dict]:
    """
    Search Pinecone for relevant past generations.
    Returns list of matching metadata dicts.
    """
    index = get_pinecone_index()
    query_vector = get_query_embedding(query)

    filter_dict = {"user_id": {"$eq": user_id}}
    if filter_platform:
        filter_dict["platform"] = {"$eq": filter_platform}

    results = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict,
    )

    return [
        {
            "score": match.score,
            "content_type": match.metadata.get("content_type"),
            "topic": match.metadata.get("topic"),
            "platform": match.metadata.get("platform"),
            "content": match.metadata.get("content", ""),
            "created_at": match.metadata.get("created_at"),
        }
        for match in results.matches
        if match.score > 0.7  # Only return high-relevance matches
    ]


def upsert_memory(
    content: str,
    content_type: str,  # "script", "caption", "strategy", "research", "preference"
    user_id: str,
    topic: str,
    platform: str,
    extra_metadata: dict = {},
) -> str:
    """
    Store a piece of content in Pinecone with its embedding.
    Returns the vector ID.
    """
    index = get_pinecone_index()
    vector_id = str(uuid.uuid4())
    embedding = get_embedding(content)

    metadata = {
        "user_id": user_id,
        "content_type": content_type,
        "topic": topic,
        "platform": platform,
        "content": content[:1000],  # Pinecone metadata has a 40KB limit
        "created_at": int(time.time()),
        **extra_metadata,
    }

    index.upsert(vectors=[{"id": vector_id, "values": embedding, "metadata": metadata}])

    return vector_id


def batch_upsert_memory(records: list[dict]) -> list[str]:
    """
    Upsert multiple records at once (more efficient for post-generation storage).
    Each record: {content, content_type, user_id, topic, platform, extra_metadata}
    """
    index = get_pinecone_index()
    vectors = []
    ids = []

    for record in records:
        vid = str(uuid.uuid4())
        ids.append(vid)
        embedding = get_embedding(record["content"])
        vectors.append({
            "id": vid,
            "values": embedding,
            "metadata": {
                "user_id": record["user_id"],
                "content_type": record["content_type"],
                "topic": record["topic"],
                "platform": record["platform"],
                "content": record["content"][:1000],
                "created_at": int(time.time()),
                **record.get("extra_metadata", {}),
            },
        })

    # Upsert in batches of 100
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i : i + 100])

    return ids
