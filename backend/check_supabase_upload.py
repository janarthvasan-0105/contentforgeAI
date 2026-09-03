import os
from supabase import create_client
import json
from datetime import datetime, timezone, timedelta

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)

try:
    print("--- RECENT SESSIONS ---")
    res = supabase.table("sessions").select("session_id, created_at, session_data").order("created_at", desc=True).limit(3).execute()
    for row in res.data:
        print(f"Session: {row['session_id']}")
        print(f"Created: {row['created_at']}")
        
        data = row.get("session_data", {})
        post_urls = data.get("rendered_post_urls", [])
        if post_urls:
            print("Post URLs:")
            for u in post_urls:
                print(f"  - {u}")
        else:
            print("No post URLs found in session_data.")
        print("-" * 30)

    print("\n--- RECENT BUCKET FILES ---")
    # List files in the outputs bucket, specifically the images folder
    bucket = "outputs"
    files_res = supabase.storage.from_(bucket).list("images")
    if files_res:
        # Sort by updated_at or created_at if possible, otherwise just print
        # files_res is a list of dicts: {'name': '...', 'id': '...', 'updated_at': '...', ...}
        # Filter out anything that doesn't have updated_at
        valid_files = [f for f in files_res if f.get('updated_at')]
        sorted_files = sorted(valid_files, key=lambda x: x.get('updated_at', ''), reverse=True)
        for f in sorted_files[:5]:
            print(f"File: {f['name']} | Updated: {f.get('updated_at')}")
    else:
        print("No files found in outputs/images")

except Exception as e:
    print("Error:", e)
