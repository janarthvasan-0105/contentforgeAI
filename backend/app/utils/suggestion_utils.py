def build_suggestion_constraint(suggestion: str | None) -> str:
    if not suggestion or not suggestion.strip():
        return ""
    return f"""
STRICT USER REQUIREMENT (must be followed exactly, non-negotiable):
"{suggestion.strip()}"

This requirement overrides any default style choice elsewhere in this prompt.
If there is a conflict, the user requirement wins.
""".strip()
