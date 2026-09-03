import os
import requests
from dotenv import load_dotenv

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    print("No GROQ_API_KEY found")
else:
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
        models = response.json().get("data", [])
        for m in models:
            print(m["id"])
    except Exception as e:
        print(f"Error: {e}")
