import os
from supabase import create_client

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)

try:
    res = supabase.table("user_subscriptions").select("*").execute()
    print("User Subscriptions:")
    for row in res.data:
        print(row)
        
    users = supabase.auth.admin.list_users()
    print("\nUsers:")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}")
except Exception as e:
    print("Error:", e)
