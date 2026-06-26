import os
from PIL import Image
from typing import Tuple

COMPOSITED_OUTPUT_DIR = "outputs/composited"


def composite_logo_onto_poster(
    poster_path: str,
    logo_path: str,
    brand_name: str,
    position: str = "top-left",
    padding: int = 30,
    logo_max_width: int = 160,
    logo_max_height: int = 60
) -> str:
    """
    Composites a brand logo onto a generated poster image.

    Args:
        poster_path:     Path to generated poster PNG
        logo_path:       Path to downloaded logo PNG
        brand_name:      Brand name (used for output filename)
        position:        "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right"
        padding:         Pixels from edge
        logo_max_width:  Max logo width in pixels
        logo_max_height: Max logo height in pixels

    Returns:
        Path to composited output image
    """
    os.makedirs(COMPOSITED_OUTPUT_DIR, exist_ok=True)

    try:
        # Load poster
        poster = Image.open(poster_path).convert("RGBA")
        poster_w, poster_h = poster.size

        # Load logo
        logo = Image.open(logo_path).convert("RGBA")

        # Resize logo maintaining aspect ratio
        logo = _resize_logo(logo, logo_max_width, logo_max_height)
        logo_w, logo_h = logo.size

        # Calculate position
        x, y = _calculate_position(
            position, poster_w, poster_h,
            logo_w, logo_h, padding
        )

        # Add subtle background panel behind logo for visibility
        logo = _add_logo_background(logo)

        # Composite logo onto poster
        poster.paste(logo, (x, y), logo)

        # Save output
        safe_name = brand_name.lower().replace(" ", "_")
        session_id = os.path.basename(poster_path).replace(".png", "")
        output_path = f"{COMPOSITED_OUTPUT_DIR}/{session_id}_{safe_name}_composited.png"

        # Convert back to RGB for final PNG
        final = poster.convert("RGB")
        final.save(output_path, "PNG", quality=95)

        return output_path

    except Exception as e:
        print(f"Logo compositing failed: {str(e)}")
        # Return original poster if compositing fails
        return poster_path


def _resize_logo(
    logo: Image.Image,
    max_width: int,
    max_height: int
) -> Image.Image:
    """Resize logo to fit within max dimensions, maintaining aspect ratio."""
    orig_w, orig_h = logo.size

    ratio = min(max_width / orig_w, max_height / orig_h)
    new_w = int(orig_w * ratio)
    new_h = int(orig_h * ratio)

    return logo.resize((new_w, new_h), Image.LANCZOS)


def _calculate_position(
    position: str,
    poster_w: int,
    poster_h: int,
    logo_w: int,
    logo_h: int,
    padding: int
) -> Tuple[int, int]:
    """Calculate pixel coordinates for logo placement."""
    positions = {
        "top-left":     (padding, padding),
        "top-right":    (poster_w - logo_w - padding, padding),
        "top-center":   ((poster_w - logo_w) // 2, padding),
        "bottom-left":  (padding, poster_h - logo_h - padding),
        "bottom-right": (poster_w - logo_w - padding, poster_h - logo_h - padding),
    }
    return positions.get(position, positions["top-left"])


def _add_logo_background(logo: Image.Image) -> Image.Image:
    """
    Adds a subtle semi-transparent rounded background behind the logo
    so it's visible on any poster background.
    """
    logo_w, logo_h = logo.size
    padding = 10

    bg_w = logo_w + padding * 2
    bg_h = logo_h + padding * 2
    background = Image.new("RGBA", (bg_w, bg_h), (0, 0, 0, 0))

    from PIL import ImageDraw
    draw = ImageDraw.Draw(background)
    draw.rounded_rectangle(
        [0, 0, bg_w - 1, bg_h - 1],
        radius=8,
        fill=(0, 0, 0, 120)    # black, 47% opacity
    )

    # Paste logo centered on background
    background.paste(logo, (padding, padding), logo)
    return background


def composite_all_carousel_logos(
    image_paths: list,
    logo_path: str,
    brand_name: str
) -> list:
    """
    Composites logo onto all carousel slide images.
    Returns list of composited image paths.
    """
    composited = []
    for path in image_paths:
        result = composite_logo_onto_poster(
            path, logo_path, brand_name,
            position="top-left"
        )
        composited.append(result)
    return composited
