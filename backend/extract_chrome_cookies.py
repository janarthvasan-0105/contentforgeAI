import os
import json
import sys

SESSION_DIR = "storage/twitter_session"
SESSION_FILE = os.path.join(SESSION_DIR, "twitter_session.json")

# Profiles confirmed to have auth_token
PROFILES_WITH_AUTH = ["Profile 17", "Profile 23", "Profile 3"]

def main():
    print("=" * 60)
    print("  ContentForge -- Extract Chrome Twitter Session")
    print("=" * 60)
    print()

    try:
        import browser_cookie3
    except ImportError:
        print("[ERROR] browser-cookie3 not installed. Run: pip install browser-cookie3")
        sys.exit(1)

    base = os.path.expandvars("%LOCALAPPDATA%") + r"\Google\Chrome\User Data"

    for profile in PROFILES_WITH_AUTH:
        print(f"[*] Trying {profile}...")

        # Try both cookie file locations for this profile
        for cookie_subpath in [r"Network\Cookies", "Cookies"]:
            cookie_file = os.path.join(base, profile, cookie_subpath)
            if not os.path.exists(cookie_file):
                continue

            try:
                # browser_cookie3 can target a specific profile's cookie file
                cookie_jar = browser_cookie3.chrome(
                    cookie_file=cookie_file,
                    domain_name=""  # get all domains, we'll filter below
                )
                all_cookies = list(cookie_jar)

                # Filter to X / Twitter only
                x_cookies = [
                    c for c in all_cookies
                    if any(d in c.domain for d in ["x.com", "twitter.com"])
                ]

                auth_cookie = next((c for c in x_cookies if c.name == "auth_token"), None)
                ct0_cookie  = next((c for c in x_cookies if c.name == "ct0"), None)

                if auth_cookie and auth_cookie.value:
                    print(f"[OK] Profile {profile}: auth_token DECRYPTED successfully!")
                    print(f"     Found {len(x_cookies)} X/Twitter cookies")

                    playwright_cookies = []
                    for c in x_cookies:
                        expires = float(c.expires) if c.expires else -1
                        playwright_cookies.append({
                            "name": c.name,
                            "value": c.value,
                            "domain": c.domain.lstrip("."),
                            "path": c.path or "/",
                            "expires": expires,
                            "httpOnly": bool(c.has_nonstandard_attr("HttpOnly")),
                            "secure": bool(c.secure),
                            "sameSite": "Lax"
                        })

                    storage_state = {"cookies": playwright_cookies, "origins": []}
                    os.makedirs(SESSION_DIR, exist_ok=True)
                    with open(SESSION_FILE, "w", encoding="utf-8") as f:
                        json.dump(storage_state, f, indent=2)

                    print()
                    print(f"[OK] Session saved to: {SESSION_FILE}")
                    print()
                    print("  Key cookies:")
                    for name in ["auth_token", "ct0", "twid", "kdt"]:
                        cookie = next((c for c in playwright_cookies if c["name"] == name), None)
                        if cookie:
                            status = "PRESENT" if cookie["value"] else "EMPTY"
                            print(f"    {name:20s}  {status}")
                    print()
                    print("[SUCCESS] Twitter session saved! Auto-publish will use this session.")
                    print("=" * 60)
                    return
                else:
                    print(f"  auth_token value is empty for {profile} — trying next profile...")

            except Exception as e:
                print(f"  Error reading {profile}: {e}")

    print()
    print("[ERROR] Could not extract a valid authenticated session.")
    print("Make sure you are logged into x.com in Chrome and Chrome is closed.")
    print("=" * 60)
    sys.exit(1)


if __name__ == "__main__":
    main()
