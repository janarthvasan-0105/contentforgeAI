import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

print("Uploading base_template to Cloudinary...")

response = cloudinary.uploader.upload(
    "https://dummyimage.com/1080x1080/111827/111827",
    public_id="contentforge/base_template",
    overwrite=True,
    invalidate=True
)

print("Upload successful!")
print("Public ID:", response.get("public_id"))
print("URL:", response.get("secure_url"))
