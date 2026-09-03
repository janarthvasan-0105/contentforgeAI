import os
from supabase import create_client
from datetime import datetime, timezone

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)
now_str = datetime.now(timezone.utc).isoformat()

try:
    res = supabase.table("user_twitter_accounts").update({"connected_at": now_str}).neq("user_id", "nothing").execute()
    print("Updated rows:", len(res.data) if res.data else 0)
except Exception as e:
    print("Error:", e)
