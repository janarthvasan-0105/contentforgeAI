import os
from supabase import create_client
import json

url = "https://myfinzncityprbujrnjr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Zmluem5jaXR5cHJidWpybmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM3MzEwMywiZXhwIjoyMDk3OTQ5MTAzfQ.SN0LWywQL7jssXRkoe1wNDHWPksMf_Kc1bBV58SOww4"

supabase = create_client(url, key)

try:
    res = supabase.table("sessions").select("session_id, status, session_data").execute()
    for row in res.data:
        data_str = json.dumps(row.get("session_data", {}))
        if "1172b0e0" in data_str or "662242b5" in data_str or "42a32f67" in data_str:
            print("Session:", row["session_id"])
            print("Status in DB:", row.get("status"))
            print("Status in JSON:", row.get("session_data", {}).get("status"))
            print("Errors:", row.get("session_data", {}).get("errors"))
            print("---")
            
except Exception as e:
    print("Error:", e)
