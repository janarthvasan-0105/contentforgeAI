import os, asyncio
from dotenv import load_dotenv
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_KEY = os.getenv("PINECONE_API_KEY")
SERPER_KEY = os.getenv("SERPER_API_KEY")

print("="*50)
print("ContentForge AI — API Diagnostic")
print("="*50)

# ── TEST 1: Gemini ──
print("\n[1] Testing Gemini API...")
try:
    from google import genai
    client = genai.Client(api_key=GEMINI_KEY)
    
    # List available models first
    print("Available models:")
    available = []
    for m in client.models.list():
        if hasattr(m, 'supported_actions') and m.supported_actions and 'generateContent' in m.supported_actions:
            available.append(m.name)
            print(f"    - {m.name}")
    
    if not available:
        print("    [FAIL] No models found - API key may be invalid or region-restricted")
    else:
        # Try generating with first available model
        model_name = available[0].replace("models/", "")
        response = client.models.generate_content(
            model=model_name,
            contents="Say hello in one word."
        )
        print(f"    [OK] Generation works! Used: {model_name}")
        print(f"    Response: {response.text}")
except Exception as e:
    print(f"    [FAIL] GEMINI FAILED: {e}")

# -- TEST 2: Pinecone --
print("\n[2] Testing Pinecone...")
try:
    from pinecone import Pinecone
    pc = Pinecone(api_key=PINECONE_KEY)
    indexes = [i.name for i in pc.list_indexes()]
    print(f"    [OK] Pinecone connected. Indexes: {indexes}")
except Exception as e:
    print(f"    [FAIL] PINECONE FAILED: {e}")

# -- TEST 3: Serper --
print("\n[3] Testing Serper API...")
try:
    import httpx
    res = httpx.post(
        "https://google.serper.dev/search",
        json={"q": "test", "num": 1},
        headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
        timeout=10
    )
    if res.status_code == 200:
        print(f"    [OK] Serper works! Status: {res.status_code}")
    else:
        print(f"    [FAIL] SERPER FAILED: HTTP {res.status_code} - {res.text}")
except Exception as e:
    print(f"    [FAIL] SERPER FAILED: {e}")

# -- TEST 4: Env file check --
print("\n[4] Checking .env values...")
keys = {
    "GEMINI_API_KEY": GEMINI_KEY,
    "PINECONE_API_KEY": PINECONE_KEY,
    "SERPER_API_KEY": SERPER_KEY,
    "PINECONE_INDEX_NAME": os.getenv("PINECONE_INDEX_NAME"),
    "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY"),
}
for k, v in keys.items():
    if not v or v.strip() == "" or "your_" in str(v):
        print(f"    [FAIL] {k} is MISSING or still has placeholder value!")
    else:
        print(f"    [OK] {k} = {v[:8]}...")

print("\n" + "="*50)
print("Paste the output above to diagnose the issue.")
print("="*50)
