# Run this script ONCE to log into X (Twitter) manually.
# It opens a real browser window - you log in by hand.
# When you see your home timeline, press ENTER in this terminal.
# The session cookies are saved and future auto-publishing will skip login entirely.
#
# Usage:
#   cd d:/ContentForge/backend
#   python login_twitter_once.py

import os
import sys
from playwright.sync_api import sync_playwright

SESSION_DIR = "storage/twitter_session"
SESSION_FILE = os.path.join(SESSION_DIR, "twitter_session.json")


def main():
    print("=" * 60)
    print("  ContentForge — Twitter One-Time Login")
    print("=" * 60)
    print()

    if os.path.exists(SESSION_FILE):
        print(f"[!] A saved session already exists at:")
        print(f"    {SESSION_FILE}")
        choice = input("\nOverwrite it with a fresh login? (y/N): ").strip().lower()
        if choice != "y":
            print("[OK] Keeping existing session. Exiting.")
            sys.exit(0)

    os.makedirs(SESSION_DIR, exist_ok=True)

    print()
    print("[*] Opening browser... Log into X manually.")
    print("[*] Once you see your HOME TIMELINE, come back here and press ENTER.")
    print()

    with sync_playwright() as p:
        chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        if not os.path.exists(chrome_exe):
            chrome_exe = os.path.expandvars(
                r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
            )

        browser = p.chromium.launch(
            headless=False,
            slow_mo=0,
            executable_path=chrome_exe if os.path.exists(chrome_exe) else None,
            args=["--start-maximized", "--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()
        page.goto("https://x.com/login", wait_until="domcontentloaded", timeout=60000)

        print("-" * 60)
        input("  >> Press ENTER once you are fully logged in to X... ")
        print("-" * 60)
        print()
        print("[*] Saving session cookies...")

        # Save FIRST before any checks that might fail if browser was closed
        try:
            context.storage_state(path=SESSION_FILE)
            print(f"[OK] Session saved to: {SESSION_FILE}")
        except Exception as e:
            print(f"[ERROR] Could not save session: {e}")
            print("[!] Make sure the browser window is still open when you press ENTER.")
            sys.exit(1)

        # Now close
        try:
            browser.close()
        except Exception:
            pass  # already closed - that's fine

        print()
        print(f"[✓] Session saved to: {SESSION_FILE}")
        print()
        print("  From now on, ContentForge will reuse these cookies")
        print("  and skip the login flow entirely on every publish.")
        print()
        print("=" * 60)


if __name__ == "__main__":
    main()
