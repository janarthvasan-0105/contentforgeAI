import os
from supabase import create_client
import os
from supabase import create_client

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)

try:
    res = supabase.table("user_subscriptions").select("*").limit(5).execute()
    print("Read success:", res.data)
except Exception as e:
    print("Error:", e)
    print("Read success:", res.data)
    
    # Try updating a non-existent user just to see if it throws an RLS error
    res2 = supabase.table("user_subscriptions").update({"tier": "studio"}).eq("user_id", "00000000-0000-0000-0000-000000000000").execute()
    print("Update result:", res2.data)
except Exception as e:
    print("Error:", e)
