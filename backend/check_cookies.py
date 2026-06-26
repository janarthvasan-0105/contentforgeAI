import browser_cookie3
import sys

for browser_name, fn in [("Chrome", browser_cookie3.chrome), ("Edge", browser_cookie3.edge)]:
    try:
        cookies = list(fn(domain_name=".x.com")) + list(fn(domain_name=".twitter.com"))
        print(f"{browser_name}: {len(cookies)} X cookies found")
        for c in cookies:
            print(f"  - {c.name} ({c.domain})")
    except Exception as e:
        print(f"{browser_name}: Error - {e}")
