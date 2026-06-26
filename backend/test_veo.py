import os
from google import genai
from google.genai import types as gtypes
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.getenv('GOOGLE_API_KEY')
print(f'Key loaded: {api_key[:5]}...')

client = genai.Client(api_key=api_key)
print('Client initialized. Testing model...')

try:
    op = client.models.generate_videos(
        model='veo-3.1-lite-generate-preview',
        prompt='A test video',
        config=gtypes.GenerateVideosConfig(
            aspect_ratio='16:9'
        )
    )
    print('Job submitted! Waiting for completion...')
except Exception as e:
    print(f'ERROR: {e}')
