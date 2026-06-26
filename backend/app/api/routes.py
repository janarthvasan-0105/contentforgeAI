import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
from app.models.schemas import GenerateRequest, ContentOutput
from app.api.auth import verify_token
from app.api.database import supabase
from app.workflow.graph import run_workflow
from app.utils.twitter_token_manager import (
    encrypt_token, decrypt_token,
    check_token_expiry_by_timestamp,
    validate_tokens_live, full_token_check,
    build_playwright_cookies,
)
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import Request
import os
import aiofiles
from pathlib import Path

router = APIRouter()


def resolve_tone(
    tone: Optional[str],
    platform: str,
    audience: str
) -> str:
    if tone:
        return tone

    audience_lower = audience.lower()
    professional_keywords = [
        "professional", "business", "executive", "manager",
        "entrepreneur", "founder", "developer", "engineer"
    ]
    is_professional_audience = any(
        kw in audience_lower for kw in professional_keywords
    )

    rules = {
        "instagram": "professional" if is_professional_audience else "entertaining",
        "youtube": "educational",
        "linkedin": "professional",
    }

    return rules.get(platform.lower(), "educational")


def get_video_config(platform: str) -> dict:
    configs = {
        "instagram": {
            "frame_size": "1080x1920",
            "aspect_ratio": "9:16",
            "duration_min": 15,
            "duration_max": 90,
            "hook_duration": 3,
            "style": "fast-paced, trendy, entertainment-focused",
            "hook_guidance": "First 1-3 seconds must stop the scroll immediately"
        },
        "youtube": {
            "frame_size": "1920x1080",
            "aspect_ratio": "16:9",
            "duration_min": 180,
            "duration_max": 600,
            "hook_duration": 15,
            "style": "educational, detailed, informative",
            "hook_guidance": "First 5-15 seconds must clearly state what viewer will learn"
        },
        "linkedin": {
            "frame_size": "1920x1080",
            "aspect_ratio": "16:9",
            "duration_min": 30,
            "duration_max": 60,
            "hook_duration": 15,
            "style": "professional, insightful, business-focused",
            "hook_guidance": "First 15 seconds must establish professional credibility"
        }
    }
    return configs.get(platform.lower(), configs["instagram"])


def sanitize_content_output(data: dict) -> dict:
    from app.models.schemas import ScriptOutput
    sanitized = {}
    for field_name, field_info in ContentOutput.model_fields.items():
        if field_name not in data:
            continue
        val = data[field_name]
        if val is None:
            continue

        annotation = field_info.annotation
        type_str = str(annotation)

        try:
            if "List" in type_str or "list" in type_str:
                if not isinstance(val, list):
                    if isinstance(val, (str, dict, int, float)):
                        val = [val]
                    else:
                        val = list(val)

                if "ScriptOutput" in type_str:
                    sanitized_scripts = []
                    for item in val:
                        if isinstance(item, dict):
                            sanitized_item = {}
                            for s_field, s_info in ScriptOutput.model_fields.items():
                                s_val = item.get(s_field)
                                if s_val is None:
                                    s_val = ""
                                sanitized_item[s_field] = str(s_val)
                            sanitized_scripts.append(sanitized_item)
                        else:
                            sanitized_scripts.append({
                                "duration": "30s",
                                "hook": "",
                                "value": "",
                                "cta": "",
                                "full_script": str(item)
                            })
                    val = sanitized_scripts
                elif "dict" in type_str or "Dict" in type_str:
                    val = [item if isinstance(item, dict) else {"content": str(item)} for item in val]
                else:
                    val = [str(item) for item in val]
            elif "dict" in type_str or "Dict" in type_str:
                if not isinstance(val, dict):
                    val = {"value": str(val)}
            elif "str" in type_str:
                val = str(val)
            elif "bool" in type_str:
                val = bool(val)
            elif "int" in type_str:
                try:
                    val = int(val)
                except Exception:
                    val = 0
            elif "float" in type_str:
                try:
                    val = float(val)
                except Exception:
                    val = 0.0

            sanitized[field_name] = val
        except Exception:
            pass

    return sanitized


# ── Generate ──────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=ContentOutput)
async def generate_content(
    request: Request,
    current_user: str = Depends(verify_token)
):
    request_id   = str(uuid.uuid4())
    content_type = request.headers.get("content-type", "")
    poster_path  = None
    video_path   = None
    auto_publish = False

    if "multipart/form-data" in content_type:
        form       = await request.form()
        posterFile = form.get("posterFile")
        videoFile  = form.get("videoFile")

        if posterFile and hasattr(posterFile, "filename") and posterFile.filename:
            img_dir = Path("storage/twitter_media/images")
            img_dir.mkdir(parents=True, exist_ok=True)
            poster_path = str(img_dir / posterFile.filename)
            async with aiofiles.open(poster_path, 'wb') as out_file:
                content = await posterFile.read()
                await out_file.write(content)

        if videoFile and hasattr(videoFile, "filename") and videoFile.filename:
            vid_dir = Path("storage/twitter_media/videos")
            vid_dir.mkdir(parents=True, exist_ok=True)
            video_path = str(vid_dir / videoFile.filename)
            async with aiofiles.open(video_path, 'wb') as out_file:
                content = await videoFile.read()
                await out_file.write(content)

        req_data = {}
        for k, v in form.items():
            if k in ["posterFile", "videoFile"]:
                continue
            if isinstance(v, str):
                if v.lower() == "true":
                    v = True
                elif v.lower() == "false":
                    v = False
            req_data[k] = v

        if "languages" in req_data and isinstance(req_data["languages"], str):
            req_data["languages"] = req_data["languages"].split(",")

        auto_publish = req_data.get("auto_publish", False)
        gen_request  = GenerateRequest(**req_data)
    else:
        json_data   = await request.json()
        gen_request = GenerateRequest(**json_data)

    initial_state = {
        "topic":                    gen_request.topic,
        "platform":                 gen_request.platform.value,
        "audience":                 gen_request.audience,
        "tone":                     resolve_tone(
                                        gen_request.tone.value if gen_request.tone else None,
                                        gen_request.platform.value,
                                        gen_request.audience
                                    ),
        "user_id":                  current_user,
        "brand_name":               gen_request.brand_name,
        "brand_colors":             [gen_request.brand_primary_color, gen_request.brand_secondary_color],
        "brand_primary_color":      gen_request.brand_primary_color,
        "brand_secondary_color":    gen_request.brand_secondary_color,
        "target_audience":          gen_request.audience,
        "languages":                gen_request.languages,
        "image_generation_success": False,
        "video_generation_success": False,
        "use_playwright_fallback":  False,
        "session_id":               request_id,
        "visual_style":             gen_request.visual_style,
        "post_type":                gen_request.post_type,
        "cta_goal":                 gen_request.cta_goal,
        "image_style":              gen_request.image_style,
        "video_config":             get_video_config(gen_request.platform.value),
        "purpose":                  gen_request.purpose,
        "app_context_url":          gen_request.app_context_url,
        "app_context_file_content": gen_request.app_context_file_content,
        "user_suggestion":          gen_request.user_suggestion,
        "poster_path":              poster_path,
        "video_path":               video_path,
        "auto_publish":             auto_publish,
        "publish_status":           None,
        "tweet_url":                None,
        "errors":                   [],
        "status":                   "started",
    }

    try:
        result = await run_workflow(initial_state)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow failed: {str(e)}"
        )

    allowed_fields   = set(ContentOutput.model_fields.keys()) - {"request_id"}
    safe_result      = {
        k: v for k, v in result.items()
        if k in allowed_fields and v is not None
    }
    sanitized_result = sanitize_content_output(safe_result)

    return ContentOutput(request_id=request_id, **sanitized_result)


# ── Publish ───────────────────────────────────────────────────────────────────

@router.post("/publish")
async def publish_content(
    request: Request,
    current_user: str = Depends(verify_token)
):
    """Publish content to a platform (post-generation, user-reviewed)."""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" not in content_type:
        raise HTTPException(status_code=400, detail="Must send multipart/form-data")

    form      = await request.form()
    platform  = form.get("platform", "twitter")
    text      = form.get("text", "")
    hashtags  = form.get("hashtags", "")

    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    final_text = str(text)
    if hashtags:
        final_text = f"{final_text}\n\n{hashtags}"

    # ── Media files ───────────────────────────────────────────────────────
    poster_path = None
    video_path  = None
    poster_url  = form.get("posterUrl", "")
    posterFile  = form.get("posterFile")
    videoFile   = form.get("videoFile")

    if posterFile and hasattr(posterFile, "filename") and posterFile.filename:
        img_dir = Path("storage/twitter_media/images")
        img_dir.mkdir(parents=True, exist_ok=True)
        poster_path = str(img_dir / posterFile.filename)
        async with aiofiles.open(poster_path, 'wb') as out_file:
            content = await posterFile.read()
            await out_file.write(content)
    elif poster_url:
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(str(poster_url))
                if resp.status_code == 200:
                    img_dir = Path("storage/twitter_media/images")
                    img_dir.mkdir(parents=True, exist_ok=True)
                    ext         = str(poster_url).split(".")[-1].split("?")[0][:4] or "jpg"
                    poster_path = str(img_dir / f"selected_poster.{ext}")
                    async with aiofiles.open(poster_path, 'wb') as out_file:
                        await out_file.write(resp.content)
        except Exception as e:
            print(f"[Publish] Failed to download poster URL: {e}")

    if videoFile and hasattr(videoFile, "filename") and videoFile.filename:
        vid_dir = Path("storage/twitter_media/videos")
        vid_dir.mkdir(parents=True, exist_ok=True)
        video_path = str(vid_dir / videoFile.filename)
        async with aiofiles.open(video_path, 'wb') as out_file:
            content = await videoFile.read()
            await out_file.write(content)

    # ── Twitter ───────────────────────────────────────────────────────────
    if str(platform).lower() == "twitter":
        from app.twitter.browser_agent import publish_to_twitter

        print(f"[Publish] current_user: {current_user}")

        # ── DB check ──────────────────────────────────────────────────────
        if supabase is None:
            raise HTTPException(status_code=500, detail="Database not available.")

        res = supabase.table("user_twitter_accounts") \
            .select("*").eq("user_id", current_user).execute()

        print(f"[Publish] DB rows found: {len(res.data) if res.data else 0}")

        if not res.data:
            raise HTTPException(
                status_code=400,
                detail="No Twitter account connected. Go to Settings → Twitter."
            )

        row          = res.data[0]
        connected_at = datetime.fromisoformat(
            row["connected_at"].replace('Z', '+00:00')
        )

        print(f"[Publish] handle: {row.get('twitter_handle')} | connected_at: {connected_at}")
        print(f"[Publish] auth_token_enc present: {bool(row.get('auth_token_enc'))}")
        print(f"[Publish] ct0_enc present: {bool(row.get('ct0_enc'))}")

        # ── Full token check ──────────────────────────────────────────────
        print(f"[Publish] Running full_token_check...")
        try:
            check = await full_token_check(
                auth_token_enc = row["auth_token_enc"],
                ct0_enc        = row["ct0_enc"],
                connected_at   = connected_at,
            )
        except Exception as e:
            print(f"[Publish] full_token_check exception: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Token check failed: {str(e)}"
            )

        print(f"[Publish] can_publish: {check.get('can_publish')}")
        print(f"[Publish] block_reason: {check.get('block_reason')}")
        print(f"[Publish] auth_token in check: {bool(check.get('auth_token'))}")
        print(f"[Publish] ct0 in check: {bool(check.get('ct0'))}")

        if not check.get("can_publish"):
            raise HTTPException(
                status_code=400,
                detail=f"Twitter tokens expired or invalid: {check.get('message')}"
            )

        # ── Get decrypted tokens ──────────────────────────────────────────
        auth_token = check.get("auth_token")
        ct0        = check.get("ct0")

        # Fallback — decrypt directly if full_token_check didn't return them
        if not auth_token or not ct0:
            print(f"[Publish] Tokens missing from check — trying direct decrypt...")
            try:
                auth_token = decrypt_token(row["auth_token_enc"])
                ct0        = decrypt_token(row["ct0_enc"])
                print(f"[Publish] Direct decrypt OK — auth_token: {bool(auth_token)}, ct0: {bool(ct0)}")
            except Exception as e:
                print(f"[Publish] Direct decrypt failed: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to decrypt tokens: {str(e)}"
                )

        # ── Build cookies ─────────────────────────────────────────────────
        cookies = build_playwright_cookies(auth_token, ct0)
        print(f"[Publish] Cookies built: {len(cookies)} | names: {[c['name'] for c in cookies]}")

        if not cookies:
            raise HTTPException(
                status_code=500,
                detail="Failed to build cookies for publishing."
            )

        # ── Publish via Playwright ────────────────────────────────────────
        print(f"[Publish] Calling publish_to_twitter...")
        print(f"[Publish] Tweet preview: {final_text[:80]}...")

        try:
            result = await publish_to_twitter(
                final_text,
                poster_path,
                video_path,
                cookies,
            )
        except Exception as e:
            print(f"[Publish] publish_to_twitter exception: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Publish failed: {str(e)}"
            )

        print(f"[Publish] Result: {result}")

        # ── Update last_verified_at on success ────────────────────────────
        if result.get("status") == "success":
            try:
                supabase.table("user_twitter_accounts").update({
                    "last_verified_at": datetime.now(timezone.utc).isoformat()
                }).eq("user_id", current_user).execute()
                print(f"[Publish] ✅ last_verified_at updated")
            except Exception as e:
                print(f"[Publish] Warning: failed to update last_verified_at: {e}")

        return {
            "status":   result.get("status", "failed"),
            "url":      result.get("url", ""),
            "error":    result.get("reason", ""),
            "platform": "twitter",
        }

    else:
        return {
            "status":   "coming_soon",
            "url":      "",
            "error":    f"Publishing to {platform} is coming soon!",
            "platform": str(platform),
        }


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "ContentForge AI"}


# ── Twitter Per-User System ───────────────────────────────────────────────────

class TwitterConnectRequest(BaseModel):
    user_id:        str
    auth_token:     str
    ct0:            str
    twitter_handle: str = ""


class TwitterDisconnectRequest(BaseModel):
    user_id: str


@router.post("/twitter/connect")
async def connect_twitter(payload: TwitterConnectRequest):
    live = await validate_tokens_live(payload.auth_token, payload.ct0)
    if not live["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Token validation failed: {live['message']}"
        )

    handle   = payload.twitter_handle or live.get("handle", "")
    auth_enc = encrypt_token(payload.auth_token)
    ct0_enc  = encrypt_token(payload.ct0)
    now      = datetime.now(timezone.utc).isoformat()

    if supabase is not None:
        supabase.table("user_twitter_accounts").upsert({
            "user_id":          payload.user_id,
            "auth_token_enc":   auth_enc,
            "ct0_enc":          ct0_enc,
            "twitter_handle":   handle,
            "connected_at":     now,
            "last_verified_at": now,
            "token_status":     "active",
            "updated_at":       now,
        }).execute()

    return {
        "success": True,
        "handle":  handle,
        "message": f"✅ Twitter account {handle} connected.",
    }


@router.get("/twitter/status/{user_id}")
async def get_twitter_status(user_id: str):
    if supabase is None:
        return {
            "connected": False,
            "handle":    None,
            "status":    "not_connected",
            "message":   "DB not available.",
        }

    res = supabase.table("user_twitter_accounts") \
        .select("*").eq("user_id", user_id).execute()

    if not res.data:
        return {
            "connected": False,
            "handle":    None,
            "status":    "not_connected",
            "days_left": None,
            "message":   "No Twitter account connected.",
        }

    row          = res.data[0]
    connected_at = datetime.fromisoformat(
        row["connected_at"].replace('Z', '+00:00')
    )
    ts = check_token_expiry_by_timestamp(connected_at)

    return {
        "connected":     True,
        "handle":        row.get("twitter_handle"),
        "status":        ts["status"],
        "days_left":     ts["days_left"],
        "days_since":    ts["days_since"],
        "connected_at":  row.get("connected_at"),
        "last_verified": row.get("last_verified_at"),
        "message":       ts["message"],
    }


@router.post("/twitter/disconnect")
async def disconnect_twitter(payload: TwitterDisconnectRequest):
    if supabase is not None:
        supabase.table("user_twitter_accounts") \
            .delete().eq("user_id", payload.user_id).execute()
    return {"success": True, "message": "Twitter account disconnected."}


@router.post("/twitter/live-check/{user_id}")
async def live_check_twitter(user_id: str):
    if supabase is None:
        raise HTTPException(status_code=500, detail="DB not available")

    res = supabase.table("user_twitter_accounts") \
        .select("*").eq("user_id", user_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="No Twitter account connected.")

    row        = res.data[0]
    auth_token = decrypt_token(row["auth_token_enc"])
    ct0        = decrypt_token(row["ct0_enc"])
    live       = await validate_tokens_live(auth_token, ct0)

    if live["valid"]:
        supabase.table("user_twitter_accounts").update({
            "last_verified_at": datetime.now(timezone.utc).isoformat()
        }).eq("user_id", user_id).execute()

    return live