from app.services.storage_service import upload_media_to_supabase
import os

dummy_path = "outputs/images/dummy_test_image.png"
os.makedirs("outputs/images", exist_ok=True)
with open(dummy_path, "wb") as f:
    f.write(b"this is a dummy png file for testing")

try:
    url = upload_media_to_supabase(dummy_path)
    print("SUCCESS:", url)
except Exception as e:
    print("FAILED:", e)
