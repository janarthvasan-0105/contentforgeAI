import os
from supabase import create_client

url = "https://myfinzncityprbujrnjr.supabase.co"
# The anon key from frontend/.env.local
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzMxMDMsImV4cCI6MjA5Nzk0OTEwM30.K-n5zl6UHIgcjUtTDhz5ixkKe_UkqUFeHjgh6p73LyQ"

supabase = create_client(url, key)

try:
    res = supabase.table("user_subscriptions").select("*").limit(5).execute()
    print("Anon Read success:", res.data)
except Exception as e:
    print("Anon Error:", e)
