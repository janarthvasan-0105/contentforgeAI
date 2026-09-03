import os
from app.api.database import supabase

BUCKET_NAME = "outputs"

def upload_media_to_supabase(local_file_path: str, content_type: str = None) -> str:
    """
    Uploads a local file to Supabase Storage and returns the public URL.
    """
    # Ensure bucket exists
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if BUCKET_NAME not in bucket_names:
            print(f"Bucket {BUCKET_NAME} not found. Creating it...")
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
    except Exception as e:
        print(f"Error checking/creating bucket: {e}")

    file_name = os.path.basename(local_file_path)
    
    # Determine folder based on file extension
    ext = file_name.split('.')[-1].lower()
    folder = "videos" if ext in ["mp4", "mov", "webm"] else "images"
    supabase_path = f"{folder}/{file_name}"

    if not content_type:
        if ext in ["png"]: content_type = "image/png"
        elif ext in ["jpg", "jpeg"]: content_type = "image/jpeg"
        elif ext in ["mp4"]: content_type = "video/mp4"
        else: content_type = "application/octet-stream"

    with open(local_file_path, "rb") as f:
        file_bytes = f.read()

    print(f"[Storage] Uploading {file_name} to Supabase bucket '{BUCKET_NAME}'...")
    
    supabase.storage.from_(BUCKET_NAME).upload(
        supabase_path,
        file_bytes,
        {"content-type": content_type, "upsert": "true"},
    )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(supabase_path)
    print(f"[Storage] Successfully uploaded. URL: {public_url}")
    return public_url
