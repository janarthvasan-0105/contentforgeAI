import sqlite3
import os

db = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data\Default\Network\Cookies")
uri = f"file:{db}?mode=ro&nolock=1&immutable=1"
conn = sqlite3.connect(uri, uri=True)
cur = conn.cursor()

cur.execute("SELECT DISTINCT host_key FROM cookies ORDER BY host_key")
print("All domains in Chrome cookies DB:")
for row in cur.fetchall():
    print(f"  {row[0]}")

print()
cur.execute("SELECT host_key, name FROM cookies WHERE host_key LIKE '%twitter%' OR host_key LIKE '%.x.com' OR host_key = 'x.com'")
rows = cur.fetchall()
print(f"Twitter/X cookies ({len(rows)} found):")
for row in rows:
    print(f"  {row[0]}  {row[1]}")

conn.close()
