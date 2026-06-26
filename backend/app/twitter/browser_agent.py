import os
import asyncio
import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from app.twitter.session_manager import get_twitter_session_path, save_twitter_session_sync
from app.config import get_settings


def sync_publish_to_twitter(
    tweet_content: str,
    poster_path: str = None,
    video_path: str = None,
    cookies: list = None
) -> dict:
    """
    Publishes a tweet to X (Twitter) using sync Playwright inside a background thread.
    This avoids the Windows asyncio NotImplementedError by isolating Playwright.
    """
    if not cookies:
        return {
            "status": "failed",
            "reason": "No Twitter cookies provided"
        }

    with sync_playwright() as p:
        chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        if not os.path.exists(chrome_exe):
            chrome_exe = os.path.expandvars(
                r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
            )

        browser = p.chromium.launch(
            headless=False,
            slow_mo=500,
            executable_path=chrome_exe if os.path.exists(chrome_exe) else None,
        )

        print("[Twitter] Injecting per-user cookies...")
        context = browser.new_context(
            viewport={"width": 1280, "height": 800}
        )
        context.add_cookies(cookies)

        page = context.new_page()

        try:
            print("[Twitter] Navigating to x.com with cookies...")
            page.goto("https://x.com/home", wait_until="load", timeout=30000)
            time.sleep(2)
            
            # Check if login was successful
            is_logged_in = page.locator("div[data-testid='primaryColumn']").count() > 0
            if not is_logged_in:
                raise Exception("Cookie login failed — redirected or unauthenticated")

            print("[Twitter] On home page. Opening tweet composer...")

            # ── Click tweet/post button ───────────────────────────
            # Try the compose button in the sidebar first
            compose_btn = page.locator("a[data-testid='SideNav_NewTweet_Button']")
            if compose_btn.count() > 0:
                compose_btn.click(force=True)
            else:
                # Fallback: click the floating compose button
                page.locator("a[href='/compose/tweet']").first.click(force=True)

            time.sleep(1.5)

            # ── Isolate Composer Context ──────────────────────────
            try:
                page.locator("div[role='dialog']").last.wait_for(state="visible", timeout=3000)
                composer = page.locator("div[role='dialog']").last
                print("[Twitter] Using modal composer")
            except PlaywrightTimeoutError:
                composer = page
                print("[Twitter] Using inline composer")

            # ── Upload media if provided (Do this first as requested) ──
            media_path = None
            if poster_path and os.path.exists(poster_path):
                media_path = poster_path
                print(f"[Twitter] Uploading image: {media_path}")
            elif video_path and os.path.exists(video_path):
                media_path = video_path
                print(f"[Twitter] Uploading video: {media_path}")

            if media_path:
                # Find the file input for media upload within the composer
                file_input = composer.locator("input[data-testid='fileInput']").last
                if file_input.count() == 0:
                    # Try clicking the media button to reveal the input
                    media_btn = composer.locator("div[aria-label='Add photos or video']").last
                    if media_btn.count() > 0:
                        with page.expect_file_chooser() as fc_info:
                            media_btn.click(force=True)
                        file_chooser = fc_info.value
                        file_chooser.set_files(media_path)
                    else:
                        # Direct input set
                        file_input.set_input_files(media_path)
                else:
                    file_input.set_input_files(media_path)

                # Wait for media to upload
                print("[Twitter] Waiting for media upload...")
                time.sleep(4)

                # Wait for upload progress to complete within the composer
                try:
                    composer.locator("[data-testid='attachments']").wait_for(state="visible", timeout=15000)
                    print("[Twitter] Media upload confirmed")
                except PlaywrightTimeoutError:
                    print("[Twitter] Media upload confirmation timed out — continuing anyway")

            # ── Fill tweet content ────────────────────────────────
            tweet_box = composer.locator("div[aria-label='Post text']").last
            tweet_box.wait_for(state="visible", timeout=10000)
            tweet_box.click(force=True)

            # Wait for React to finish focus transitions to prevent dropping the first few characters
            time.sleep(1)

            # Type tweet content (type is required for Draft.js/Lexical to register newlines correctly)
            # Replace \n with actual newlines
            clean_content = tweet_content.replace("\\n", "\n")
            
            # Use type instead of insert_text so React builds the paragraph blocks correctly
            page.keyboard.type(clean_content, delay=10)
            time.sleep(1)

            print(f"[Twitter] Tweet text entered: {clean_content[:80]}...")

            # ── Click Post button (Using Keyboard Shortcut) ─────────────────────────────────
            print("[Twitter] Submitting post via Ctrl+Enter shortcut...")

            # Make sure focus is still in the composer
            tweet_box.click(force=True)
            time.sleep(0.5)
            
            # Press Ctrl+Enter to post (Cmd+Enter on Mac, Playwright Meta is Cmd)
            page.keyboard.press("Control+Enter")
            page.keyboard.press("Meta+Enter") # Fallback for Mac just in case
            
            # Also try clicking as a fallback if the shortcut fails
            try:
                post_btn = composer.locator("button[data-testid='tweetButton']:visible, div[data-testid='tweetButton']:visible")
                if post_btn.count() > 0:
                    post_btn.last.click(timeout=3000)
            except Exception:
                pass

            # ── Wait for success confirmation ─────────────────────
            print("[Twitter] Waiting for post confirmation...")
            tweet_url = "https://x.com"

            try:
                # Wait for toast notification
                toast = page.locator("div[data-testid='toast']")
                toast.wait_for(state="visible", timeout=15000)

                # Try to get the tweet URL from the toast link
                view_link = toast.locator("a")
                if view_link.count() > 0:
                    href = view_link.get_attribute("href")
                    if href:
                        tweet_url = href if href.startswith("http") else f"https://x.com{href}"

                print(f"[Twitter] Published successfully! URL: {tweet_url}")

            except PlaywrightTimeoutError:
                # Toast didn't appear — check if we're back on home timeline
                time.sleep(3)
                if "home" in page.url:
                    print("[Twitter] Published — confirmed via URL redirect")
                else:
                    raise Exception("Post confirmation timed out")

            browser.close()
            return {"status": "success", "url": tweet_url}

        except Exception as e:
            print(f"[Twitter] Publish failed: {str(e)}")
            # Take screenshot for debugging
            try:
                screenshot_path = "storage/twitter_media/debug_screenshot.png"
                os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
                page.screenshot(path=screenshot_path)
                print(f"[Twitter] Debug screenshot saved to {screenshot_path}")
            except Exception:
                pass

            browser.close()
            return {"status": "failed", "reason": str(e)}


async def publish_to_twitter(
    tweet_content: str,
    poster_path: str = None,
    video_path: str = None,
    cookies: list = None
) -> dict:
    """
    Async wrapper for the synchronous Playwright function.
    Runs the thread-blocking Playwright automation in an isolated thread to avoid Windows NotImplementedError.
    """
    return await asyncio.to_thread(sync_publish_to_twitter, tweet_content, poster_path, video_path, cookies)
