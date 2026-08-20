import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client, Client
import json

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table('analytics').select('*').limit(1).execute()
    with open('db_result.json', 'w') as f:
        json.dump({"status": "success", "data": res.data}, f)
except Exception as e:
    with open('db_result.json', 'w') as f:
        json.dump({"status": "error", "error": str(e)}, f)
