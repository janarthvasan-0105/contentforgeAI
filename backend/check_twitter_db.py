import os
from supabase import create_client

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)

try:
    res = supabase.table("user_twitter_accounts").select("*").execute()
    for row in res.data:
        print(f"User: {row['user_id']}")
        print(f"Connected At: {row.get('connected_at')}")
        print("---")
            
except Exception as e:
    print("Error:", e)
