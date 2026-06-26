# app/utils/format_config.py

# ── Universal Format Pool ─────────────────────────────────────────────────────
# All 8 formats available to any brand in any field

FORMAT_POOL = {
    "lifestyle_shot": {
        "name": "Lifestyle Shot",
        "layout": "full_bleed_photo",
        "copy_style": "emotion_led",
        "image_composition": "person_in_environment",
        "person_required": True,
        "works_best_on": ["instagram", "youtube"],
        "avoid_for_fields": [],
    },
    "bold_stat": {
        "name": "Bold Stat",
        "layout": "number_dominant",
        "copy_style": "data_driven",
        "image_composition": "text_over_gradient",
        "person_required": False,
        "works_best_on": ["linkedin", "twitter", "instagram"],
        "avoid_for_fields": ["entertainment"],
    },
    "before_after": {
        "name": "Before / After",
        "layout": "two_panel_split",
        "copy_style": "transformation",
        "image_composition": "left_right_contrast",
        "person_required": False,
        "works_best_on": ["instagram", "youtube"],
        "avoid_for_fields": ["finance", "saas"],
    },
    "testimonial_card": {
        "name": "Testimonial Card",
        "layout": "quote_card",
        "copy_style": "social_proof",
        "image_composition": "avatar_plus_quote",
        "person_required": True,
        "works_best_on": ["instagram", "linkedin", "twitter"],
        "avoid_for_fields": [],
    },
    "product_closeup": {
        "name": "Product Close-up",
        "layout": "macro_detail",
        "copy_style": "curiosity",
        "image_composition": "extreme_closeup_no_face",
        "person_required": False,
        "works_best_on": ["instagram", "youtube"],
        "avoid_for_fields": ["education", "finance"],
    },
    "authority_post": {
        "name": "Authority Post",
        "layout": "founder_face",
        "copy_style": "expert_opinion",
        "image_composition": "direct_camera_face",
        "person_required": True,
        "works_best_on": ["linkedin", "twitter", "youtube"],
        "avoid_for_fields": ["food", "entertainment"],
    },
    "meme_hook": {
        "name": "Meme / Culture Hook",
        "layout": "trend_led",
        "copy_style": "humour_or_relatability",
        "image_composition": "pop_culture_adapted",
        "person_required": False,
        "works_best_on": ["instagram", "twitter"],
        "avoid_for_fields": ["finance", "healthcare", "education"],
    },
    "minimal_typography": {
        "name": "Minimal Typography",
        "layout": "text_only",
        "copy_style": "bold_statement",
        "image_composition": "solid_brand_color_background",
        "person_required": False,
        "works_best_on": ["instagram", "linkedin", "twitter"],
        "avoid_for_fields": [],
    },
}


# ── Field → Preferred Format Order ───────────────────────────────────────────
# Each field has its own priority rotation list

FIELD_FORMAT_PRIORITY = {
    "real_estate": [
        "lifestyle_shot", "testimonial_card", "bold_stat",
        "before_after", "minimal_typography", "product_closeup"
    ],
    "fitness": [
        "before_after", "bold_stat", "lifestyle_shot",
        "testimonial_card", "product_closeup", "minimal_typography"
    ],
    "food": [
        "product_closeup", "lifestyle_shot", "meme_hook",
        "testimonial_card", "before_after", "minimal_typography"
    ],
    "fashion": [
        "lifestyle_shot", "product_closeup", "minimal_typography",
        "before_after", "testimonial_card", "meme_hook"
    ],
    "saas": [
        "bold_stat", "authority_post", "minimal_typography",
        "testimonial_card", "product_closeup", "lifestyle_shot"
    ],
    "education": [
        "authority_post", "bold_stat", "testimonial_card",
        "minimal_typography", "lifestyle_shot", "before_after"
    ],
    "finance": [
        "bold_stat", "minimal_typography", "authority_post",
        "testimonial_card", "lifestyle_shot", "product_closeup"
    ],
    "entertainment": [
        "meme_hook", "lifestyle_shot", "product_closeup",
        "bold_stat", "minimal_typography", "testimonial_card"
    ],
    "healthcare": [
        "testimonial_card", "bold_stat", "lifestyle_shot",
        "authority_post", "minimal_typography", "before_after"
    ],
    "ecommerce": [
        "product_closeup", "before_after", "lifestyle_shot",
        "testimonial_card", "bold_stat", "minimal_typography"
    ],
}

# Fallback order if field is unrecognized
DEFAULT_FORMAT_PRIORITY = [
    "lifestyle_shot", "bold_stat", "testimonial_card",
    "minimal_typography", "before_after", "product_closeup"
]


# ── Platform Format Filters ───────────────────────────────────────────────────
# Formats that perform poorly on certain platforms are deprioritized

PLATFORM_FORMAT_WEIGHTS = {
    "instagram":  ["lifestyle_shot", "product_closeup", "before_after", "meme_hook"],
    "linkedin":   ["bold_stat", "authority_post", "minimal_typography", "testimonial_card"],
    "twitter":    ["bold_stat", "meme_hook", "minimal_typography", "authority_post"],
    "youtube":    ["lifestyle_shot", "before_after", "product_closeup", "authority_post"],
}
