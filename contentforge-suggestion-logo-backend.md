# ContentForge AI — Suggestion Enforcement + Logo Uploader (Backend Implementation)

Both features are optional per-generation. Neither blocks the pipeline if unused.

---

## PART 1 — Suggestion Enforcement

### Logic overview
1. The suggestion (`user_suggestion`) is injected into **every** content-generating agent's prompt as a non-negotiable constraint block — not just passed once at the top of the graph.
2. After the core content agents run (Script, Image, Video Prompt, Hashtag), a **ComplianceAgent** node checks the combined output against the suggestion using a cheap, fast Groq call.
3. If it fails and retries remain (max 2), the graph loops back to regenerate. If retries are exhausted, it proceeds with the best-effort output rather than hanging indefinitely.

### `app/utils/suggestion_utils.py`
```python
def build_suggestion_constraint(suggestion: str | None) -> str:
    if not suggestion or not suggestion.strip():
        return ""
    return f"""
STRICT USER REQUIREMENT (must be followed exactly, non-negotiable):
"{suggestion.strip()}"

This requirement overrides any default style choice elsewhere in this prompt.
If there is a conflict, the user requirement wins.
""".strip()
```

**Usage in every agent** (Script, Image, Video Prompt, Hashtag) — add this to each agent's prompt-building function:
```python
from app.utils.suggestion_utils import build_suggestion_constraint

suggestion_block = build_suggestion_constraint(state.get("user_suggestion"))

prompt = f"""
{base_instructions}

{suggestion_block}
""".strip()
```

### `app/agents/compliance_agent.py`
```python
import json
from groq import Groq
from app.config import get_settings

settings = get_settings()
groq_client = Groq(api_key=settings.groq_api_key)

MAX_RETRIES = 2


def check_suggestion_compliance(state: dict) -> dict:
    """
    LangGraph node. Runs after script/image/video-prompt/hashtag agents.
    Verifies the user's suggestion (if any) was actually honored.
    """
    suggestion = (state.get("user_suggestion") or "").strip()
    if not suggestion:
        state["compliance_passed"] = True
        state["needs_regeneration"] = False
        return state

    retry_count = state.get("compliance_retry_count", 0)

    summary = f"""
Script: {state.get('script', '')[:500]}
Image prompt: {state.get('image_prompt', '')[:300]}
Video prompt: {state.get('video_prompt', '')[:300]}
Hashtags: {', '.join(state.get('hashtags', [])[:10])}
""".strip()

    check_prompt = f"""
User's requirement: "{suggestion}"

Generated content summary:
{summary}

Does the generated content satisfy the user's requirement?
Reply with strict JSON only: {{"satisfied": true or false, "reason": "one short sentence"}}
""".strip()

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": check_prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        satisfied = result.get("satisfied", True)
        reason = result.get("reason", "")
    except Exception as e:
        print(f"[ComplianceAgent] Check failed, defaulting to pass: {e}")
        satisfied = True
        reason = "compliance check unavailable"

    state["compliance_passed"] = satisfied
    state["compliance_reason"] = reason

    if not satisfied and retry_count < MAX_RETRIES:
        state["compliance_retry_count"] = retry_count + 1
        state["needs_regeneration"] = True
        print(f"[ComplianceAgent] Not satisfied (attempt {retry_count + 1}): {reason}. Retrying.")
    else:
        state["needs_regeneration"] = False
        if not satisfied:
            print(f"[ComplianceAgent] Max retries reached. Proceeding best-effort. Reason: {reason}")

    return state
```

### LangGraph wiring
```python
from app.agents.compliance_agent import check_suggestion_compliance

def route_after_compliance(state: dict) -> str:
    return "regenerate" if state.get("needs_regeneration") else "memory_agent"

graph.add_node("compliance_check", check_suggestion_compliance)

# Run compliance check after your existing content agents finish, e.g.:
graph.add_edge("hashtag_agent", "compliance_check")

graph.add_conditional_edges(
    "compliance_check",
    route_after_compliance,
    {
        "regenerate": "script_agent",   # loops back into content generation
        "memory_agent": "memory_agent", # proceeds to save as normal
    },
)
```

---

## PART 2 — Logo Uploader

### Logic overview
1. User uploads a logo once (PNG/SVG/JPG, max 2MB) → stored in Supabase Storage → URL saved on `users.logo_url`.
2. At generation time, if the user opts in (`use_logo: true`), the stored `logo_url` is pulled into pipeline state.
3. **Images** — logo composited as a corner watermark (~12% width, bottom-right) using Pillow.
4. **Videos** — logo shown prominently as a 1.5s intro card and 1.5s outro card, concatenated around the main Veo3 clip.

### Schema addition
```sql
alter table users add column logo_url text;
```

### `app/services/logo_service.py`
```python
import uuid
from fastapi import UploadFile, HTTPException
from app.api.database import supabase

ALLOWED_TYPES = {"image/png": "png", "image/svg+xml": "svg", "image/jpeg": "jpg"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2MB
BUCKET_NAME = "brand-assets"


async def upload_logo(file: UploadFile, user_id: str) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Logo must be PNG, SVG, or JPG")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Logo must be under 2MB")

    ext = ALLOWED_TYPES[file.content_type]
    file_path = f"{user_id}/logo_{uuid.uuid4().hex}.{ext}"

    supabase.storage.from_(BUCKET_NAME).upload(
        file_path,
        contents,
        {"content-type": file.content_type, "upsert": "true"},
    )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
    supabase.table("users").update({"logo_url": public_url}).eq("id", user_id).execute()

    return public_url


def get_user_logo(user_id: str) -> str | None:
    res = supabase.table("users").select("logo_url").eq("id", user_id).single().execute()
    return res.data.get("logo_url") if res.data else None
```

### Route additions in `app/api/routes.py`
```python
from fastapi import UploadFile, File
from app.services.logo_service import upload_logo, get_user_logo

@router.post("/api/upload-logo")
async def upload_logo_route(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token),
):
    url = await upload_logo(file, user_id)
    return {"logo_url": url}
```

**Update the generation request model** to include the opt-in flag:
```python
class GenerationRequest(BaseModel):
    # ...existing fields...
    use_logo: bool = False
```

**In the generate route**, before kicking off the pipeline:
```python
logo_url = get_user_logo(current_user) if gen_request.use_logo else None
initial_state["logo_url"] = logo_url
```

---

### `app/services/brand_overlay.py` — applying the logo

```python
import io
import os
import subprocess
import tempfile
import requests
from PIL import Image


def apply_logo_to_image(image_bytes: bytes, logo_url: str | None) -> bytes:
    """Corner watermark overlay for generated posts."""
    if not logo_url:
        return image_bytes

    base = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    logo_resp = requests.get(logo_url, timeout=10)
    logo = Image.open(io.BytesIO(logo_resp.content)).convert("RGBA")

    target_width = int(base.width * 0.12)
    ratio = target_width / logo.width
    logo = logo.resize((target_width, int(logo.height * ratio)))

    padding = int(base.width * 0.03)
    position = (base.width - logo.width - padding, base.height - logo.height - padding)
    base.paste(logo, position, logo)

    output = io.BytesIO()
    base.convert("RGB").save(output, format="JPEG", quality=92)
    return output.getvalue()


def _get_video_resolution(path: str) -> tuple[int, int]:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", path],
        capture_output=True, text=True, check=True,
    )
    w, h = result.stdout.strip().split("x")
    return int(w), int(h)


def apply_logo_to_video(video_path: str, logo_url: str | None, output_path: str) -> str:
    """Adds a 1.5s intro card and 1.5s outro card with the logo centered, matching main video's resolution."""
    if not logo_url:
        return video_path

    width, height = _get_video_resolution(video_path)

    with tempfile.TemporaryDirectory() as tmp:
        logo_path = os.path.join(tmp, "logo.png")
        logo_resp = requests.get(logo_url, timeout=10)
        with open(logo_path, "wb") as f:
            f.write(logo_resp.content)

        intro_path = os.path.join(tmp, "intro.mp4")
        outro_path = os.path.join(tmp, "outro.mp4")

        for card_path in (intro_path, outro_path):
            subprocess.run([
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"color=c=black:s={width}x{height}:d=1.5",
                "-i", logo_path,
                "-filter_complex",
                f"[1:v]scale={int(width*0.35)}:-1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2,format=yuv420p",
                "-t", "1.5",
                card_path,
            ], check=True)

        # Use the concat filter (not demuxer) — re-encodes, so mismatched
        # codecs/framerates between the cards and the Veo3 clip are handled safely.
        subprocess.run([
            "ffmpeg", "-y",
            "-i", intro_path, "-i", video_path, "-i", outro_path,
            "-filter_complex",
            "[0:v][1:v][2:v]concat=n=3:v=1:a=0[outv]",
            "-map", "[outv]",
            output_path,
        ], check=True)

    return output_path
```

**Call sites:**
- In your ImageGenerationAgent, right after the image is generated and before it's uploaded to storage:
  ```python
  image_bytes = generate_image(prompt)
  image_bytes = apply_logo_to_image(image_bytes, state.get("logo_url"))
  ```
- After the Veo3 video is downloaded/rendered, before final upload:
  ```python
  final_video_path = apply_logo_to_video(raw_video_path, state.get("logo_url"), output_path)
  ```

### Optimization note
The intro/outro cards are identical for a given logo every time. Rather than re-rendering them on every single video generation, consider rendering and caching them once per logo upload (store `intro_url`/`outro_url` alongside `logo_url` on the `users` row), and just re-encode/concat at generation time. Saves a few seconds of ffmpeg work per video once you're generating in volume.
