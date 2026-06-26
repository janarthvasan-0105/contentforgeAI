import subprocess
import time
import os
import json
import sys
from playwright.sync_api import sync_playwright

SESSION_DIR = "storage/twitter_session"
SESSION_FILE = os.path.join(SESSION_DIR, "twitter_session.json")

def main():
    print("=" * 60)
    print("  ContentForge -- Extract Cookies via Chrome CDP")
    print("=" * 60)
    print()

    # Kill any existing Chrome to ensure we can start with debugging port
    os.system("taskkill /F /IM chrome.exe /T >nul 2>&1")
    time.sleep(2)

    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_exe):
        chrome_exe = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
    
    user_data = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")

    print("[*] Starting real Chrome with Remote Debugging on Profile 17...")
    # Start Chrome detached
    process = subprocess.Popen([
        chrome_exe,
        "--remote-debugging-port=9222",
        f"--user-data-dir={user_data}",
        "--profile-directory=Profile 17",
        "https://x.com"
    ])
    
    print("[*] Waiting 5 seconds for Chrome to start...")
    time.sleep(5)

    try:
        with sync_playwright() as p:
            print("[*] Connecting Playwright to Chrome...")
            browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
            context = browser.contexts[0]
            
            print("[*] Reading decrypted cookies directly from browser memory...")
            cookies = context.cookies(["https://x.com", "https://twitter.com"])
            
            x_cookies = [c for c in cookies if "x.com" in c["domain"] or "twitter.com" in c["domain"]]
            
            if not x_cookies:
                print("[ERROR] No X.com cookies found in this browser context.")
                process.kill()
                sys.exit(1)
                
            storage_state = {"cookies": x_cookies, "origins": []}
            os.makedirs(SESSION_DIR, exist_ok=True)
            with open(SESSION_FILE, "w", encoding="utf-8") as f:
                json.dump(storage_state, f, indent=2)
                
            has_auth = any(c["name"] == "auth_token" for c in x_cookies)
            
            print()
            print(f"[OK] {len(x_cookies)} cookies extracted!")
            print(f"[OK] Session saved to {SESSION_FILE}")
            print(f"[OK] Auth Token present: {has_auth}")
            print()
            
            browser.close()
            
    except Exception as e:
        print(f"\n[ERROR] Failed to extract via CDP: {e}")
        
    print("[*] Closing Chrome...")
    os.system("taskkill /F /IM chrome.exe /T >nul 2>&1")

if __name__ == "__main__":
    main()
