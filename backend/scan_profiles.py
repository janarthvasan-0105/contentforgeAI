import sqlite3
import os

base = os.path.expandvars("%LOCALAPPDATA%") + r"\Google\Chrome\User Data"
profiles = [d for d in os.listdir(base) if d.startswith("Profile") or d == "Default"]

print(f"Scanning {len(profiles)} Chrome profiles for X/Twitter cookies...\n")

found_profile = None
for profile in profiles:
    for cookies_file in ["Network\\Cookies", "Cookies"]:
        db = os.path.join(base, profile, cookies_file)
        if not os.path.exists(db):
            continue
        try:
            uri = f"file:{db}?mode=ro&nolock=1&immutable=1"
            conn = sqlite3.connect(uri, uri=True)
            cur = conn.cursor()
            cur.execute("""
                SELECT host_key, name FROM cookies
                WHERE host_key IN ('.x.com','x.com','.twitter.com','twitter.com')
            """)
            rows = cur.fetchall()
            conn.close()
            if rows:
                print(f"[FOUND] Profile: {profile}")
                for row in rows:
                    print(f"  {row[0]}  ->  {row[1]}")
                found_profile = profile
            else:
                print(f"[ ] {profile}: no X cookies")
        except Exception as e:
            print(f"[ERR] {profile}: {e}")

print()
if found_profile:
    print(f"Use profile: {found_profile}")
else:
    print("No X/Twitter cookies found in ANY Chrome profile.")
    print("Please open Chrome, go to x.com, log in, then close Chrome and run this again.")
