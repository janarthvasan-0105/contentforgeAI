# app/agents/field_detection_agent.py
"""
Detects the industry field of the brand from the content brief.
Uses the topic, brand name, and purpose to classify into a known field.

Input:  state["topic"], state["brand_name"], state["purpose"]
Output: state["detected_field"]
"""

from app.models.state import ContentForgeState

FIELD_KEYWORDS = {
    "real_estate":   ["rent", "property", "home", "apartment", "house", "lease", "realtor", "mortgage"],
    "fitness":       ["gym", "workout", "fitness", "health", "weight", "muscle", "yoga", "training", "diet"],
    "food":          ["restaurant", "food", "recipe", "eat", "delivery", "cafe", "menu", "cuisine", "beverage"],
    "fashion":       ["fashion", "clothing", "style", "wear", "outfit", "apparel", "brand", "collection"],
    "saas":          ["app", "software", "platform", "tool", "dashboard", "productivity", "automation", "saas"],
    "education":     ["course", "learn", "teach", "training", "skill", "class", "coach", "certification", "tutorial"],
    "finance":       ["invest", "finance", "money", "insurance", "bank", "crypto", "trading", "wealth", "fintech"],
    "entertainment": ["music", "event", "game", "stream", "movie", "show", "concert", "festival", "gaming"],
    "healthcare":    ["health", "clinic", "doctor", "wellness", "medicine", "therapy", "mental", "hospital"],
    "ecommerce":     ["shop", "store", "buy", "sell", "product", "ecommerce", "marketplace", "delivery"],
}


def _detect_field(topic: str, brand_name: str, purpose: str) -> str:
    combined = f"{topic} {brand_name} {purpose}".lower()
    scores = {field: 0 for field in FIELD_KEYWORDS}

    for field, keywords in FIELD_KEYWORDS.items():
        for keyword in keywords:
            if keyword in combined:
                scores[field] += 1

    best_field = max(scores, key=scores.get)
    return best_field if scores[best_field] > 0 else "saas"  # default fallback


async def field_detection_agent(state: ContentForgeState) -> ContentForgeState:
    topic      = state.get("topic", "")
    brand_name = state.get("brand_name", "")
    purpose    = state.get("purpose", "")

    detected = _detect_field(topic, brand_name, purpose)
    state["detected_field"] = detected

    print(f"[FieldDetection] Detected field: {detected}")
    return state
