import os
from supabase import create_client

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)
current_user = "77b50d29-f31f-472a-99ef-9fbffa2170cc"

try:
    res = supabase.table("user_subscriptions").select("*").eq("user_id", current_user).execute()
    if res.data and len(res.data) > 0:
        res2 = supabase.table("user_subscriptions").update({
            "tier": "studio"
        }).eq("user_id", current_user).execute()
        print("Updated row:", res2.data)
    else:
        print("No row found!")
except Exception as e:
    print("Error:", e)
