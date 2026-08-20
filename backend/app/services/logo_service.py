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

    # Ensure bucket exists
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if BUCKET_NAME not in bucket_names:
            print(f"Bucket {BUCKET_NAME} not found. Creating it...")
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
    except Exception as e:
        print(f"Error checking/creating bucket: {e}")

    supabase.storage.from_(BUCKET_NAME).upload(
        file_path,
        contents,
        {"content-type": file.content_type, "upsert": "true"},
    )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
    supabase.table("users").update({"logo_url": public_url}).eq("id", user_id).execute()

    return public_url


def get_user_logo(user_id: str) -> str | None:
    res = supabase.table("users").select("logo_url").eq("id", user_id).execute()
    if res.data and len(res.data) > 0:
        return res.data[0].get("logo_url")
    return None
