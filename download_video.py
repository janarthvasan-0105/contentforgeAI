import urllib.request
import ssl

url = "https://assets.mixkit.co/videos/preview/mixkit-photo-studio-with-lighting-equipment-39775-large.mp4"
output_path = r"d:\ContentForge\frontend\public\cinematic.mp4"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    print(f"Downloading from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as response, open(output_path, 'wb') as out_file:
        out_file.write(response.read())
    print("Download complete.")
except Exception as e:
    print(f"Failed: {e}")
