from app.models.state import ContentForgeState
from app.twitter.browser_agent import publish_to_twitter
from app.api.database import supabase
from app.utils.twitter_token_manager import full_token_check, build_playwright_cookies
from datetime import datetime, timezone

async def twitter_publisher_agent(state: ContentForgeState) -> ContentForgeState:
    """
    Responsible for deciding whether a tweet should be published.
    """
    platform = state.get("platform", "").lower()
    auto_publish = state.get("auto_publish", False)
    
    if platform != "twitter":
        return state
        
    if not auto_publish:
        return state
        
    print("[Publisher] Auto-publishing to Twitter...")
    
    twitter_scripts = state.get("twitter_scripts", {})
    t1 = twitter_scripts.get("type1_line_break", {})
    tweet_content = t1.get("text", "")
    
    if not tweet_content:
        post_scripts = state.get("post_scripts", [])
        if post_scripts:
            tweet_content = post_scripts[0].get("body", "")
    
    if not tweet_content:
        state["publish_status"] = "failed"
        state["error"] = "No tweet content generated"
        return state
        
    # ── Hashtags ──────────────────────────────────────────────────────────
    hashtags_data = state.get("hashtags", {})
    hashtags_str  = hashtags_data.get("recommended_mix", "")
    valid_hashtags = [w for w in hashtags_str.split() if w.startswith("#")]
    
    if not valid_hashtags:
        broad  = hashtags_data.get("broad", [])
        medium = hashtags_data.get("medium", [])
        valid_hashtags = broad[:2] + medium[:2]
        
    short_hashtags = ""
    if valid_hashtags:
        short_hashtags = "\n\n" + " ".join(valid_hashtags[:3])
        
    max_base_len = 280 - len(short_hashtags) - 3
    
    if len(tweet_content) > max_base_len:
        truncated = tweet_content[:max_base_len]
        if " " in truncated:
            truncated = truncated.rsplit(" ", 1)[0]
        tweet_content = f"{truncated}..."
        
    tweet_content = f"{tweet_content}{short_hashtags}"
        
    poster_path = state.get("poster_path")
    video_path  = state.get("video_path")
    
    # ── User ID check ─────────────────────────────────────────────────────
    user_id = state.get("user_id")
    print(f"[TwitterPublisher] user_id from state: {user_id}")
    
    if not user_id:
        state["publish_status"] = "failed"
        state["error"] = "No user_id in state, cannot publish to Twitter."
        return state

    # ── DB check ──────────────────────────────────────────────────────────
    if supabase is None:
        state["publish_status"] = "failed"
        state["error"] = "Database connection error."
        return state

    # ── Fetch Twitter account from Supabase ───────────────────────────────
    print(f"[TwitterPublisher] Fetching Twitter account for user_id: {user_id}")
    res = supabase.table("user_twitter_accounts").select("*").eq("user_id", user_id).execute()
    
    print(f"[TwitterPublisher] DB result count: {len(res.data) if res.data else 0}")
    
    if not res.data:
        state["publish_status"] = "failed"
        state["error"] = "No Twitter account connected. Go to Settings → Twitter."
        state["twitter_skip_reason"] = "no_account_connected"
        return state

    row = res.data[0]
    print(f"[TwitterPublisher] Found account row, handle: {row.get('twitter_handle', 'unknown')}")
    print(f"[TwitterPublisher] auth_token_enc present: {bool(row.get('auth_token_enc'))}")
    print(f"[TwitterPublisher] ct0_enc present: {bool(row.get('ct0_enc'))}")
    print(f"[TwitterPublisher] connected_at raw: {row.get('connected_at')}")

    # ── Parse connected_at ────────────────────────────────────────────────
    try:
        connected_at_raw = row["connected_at"]
        # Handle both Z suffix and +00:00
        connected_at_raw = connected_at_raw.replace('Z', '+00:00')
        connected_at = datetime.fromisoformat(connected_at_raw)
        print(f"[TwitterPublisher] connected_at parsed: {connected_at}")
    except Exception as e:
        print(f"[TwitterPublisher] connected_at parse error: {e}")
        state["publish_status"] = "failed"
        state["error"] = f"Failed to parse connected_at: {str(e)}"
        return state

    # ── Full token check (timestamp + decrypt) ────────────────────────────
    print(f"[TwitterPublisher] Running full_token_check...")
    try:
        check = await full_token_check(
            auth_token_enc = row["auth_token_enc"],
            ct0_enc        = row["ct0_enc"],
            connected_at   = connected_at,
        )
    except Exception as e:
        print(f"[TwitterPublisher] full_token_check exception: {e}")
        state["publish_status"] = "failed"
        state["error"] = f"Token check failed: {str(e)}"
        return state

    print(f"[TwitterPublisher] full_token_check result: {check}")
    print(f"[TwitterPublisher] can_publish: {check.get('can_publish')}")
    print(f"[TwitterPublisher] block_reason: {check.get('block_reason')}")
    print(f"[TwitterPublisher] auth_token present in check: {bool(check.get('auth_token'))}")
    print(f"[TwitterPublisher] ct0 present in check: {bool(check.get('ct0'))}")

    state["twitter_token_status"]  = check.get("timestamp_status", {}).get("status", "unknown")
    state["twitter_token_message"] = check.get("message", "")

    if not check.get("can_publish"):
        print(f"[TwitterPublisher] ❌ Blocked — {check.get('block_reason')}")
        state["publish_status"] = "failed"
        state["error"] = f"Twitter publish blocked: {check.get('message', 'Unknown reason')}"
        return state

    # ── Decrypt check ─────────────────────────────────────────────────────
    auth_token = check.get("auth_token")
    ct0        = check.get("ct0")

    if not auth_token or not ct0:
        print(f"[TwitterPublisher] ❌ Tokens missing after check — auth_token: {bool(auth_token)}, ct0: {bool(ct0)}")
        # Fallback — try to decrypt directly
        print(f"[TwitterPublisher] Attempting direct decrypt fallback...")
        try:
            from app.utils.twitter_token_manager import decrypt_token
            auth_token = decrypt_token(row["auth_token_enc"])
            ct0        = decrypt_token(row["ct0_enc"])
            print(f"[TwitterPublisher] Direct decrypt success — auth_token: {bool(auth_token)}, ct0: {bool(ct0)}")
        except Exception as e:
            print(f"[TwitterPublisher] Direct decrypt also failed: {e}")
            state["publish_status"] = "failed"
            state["error"] = f"Failed to decrypt tokens: {str(e)}"
            return state

    # ── Build Playwright cookies ───────────────────────────────────────────
    print(f"[TwitterPublisher] Building playwright cookies...")
    cookies = build_playwright_cookies(auth_token, ct0)
    print(f"[TwitterPublisher] Cookies built: {len(cookies)} cookies")
    print(f"[TwitterPublisher] Cookie names: {[c['name'] for c in cookies]}")

    if not cookies:
        print(f"[TwitterPublisher] ❌ build_playwright_cookies returned empty list")
        state["publish_status"] = "failed"
        state["error"] = "Failed to build cookies for publishing."
        return state

    # ── Publish ───────────────────────────────────────────────────────────
    print(f"[TwitterPublisher] ✅ All checks passed — calling publish_to_twitter...")
    print(f"[TwitterPublisher] Tweet preview: {tweet_content[:80]}...")
    
    try:
        result = await publish_to_twitter(
            tweet_content,
            poster_path,
            video_path,
            cookies,
        )
    except Exception as e:
        print(f"[TwitterPublisher] publish_to_twitter exception: {e}")
        state["publish_status"] = "failed"
        state["error"] = f"Publish exception: {str(e)}"
        return state

    print(f"[TwitterPublisher] Publish result: {result}")

    # ── Update last_verified_at ───────────────────────────────────────────
    if result.get("status") == "success":
        try:
            supabase.table("user_twitter_accounts").update({
                "last_verified_at": datetime.now(timezone.utc).isoformat()
            }).eq("user_id", user_id).execute()
            print(f"[TwitterPublisher] ✅ last_verified_at updated")
        except Exception as e:
            print(f"[TwitterPublisher] Warning: failed to update last_verified_at: {e}")

    state["publish_status"] = result.get("status", "failed")
    
    if result.get("status") == "success":
        state["tweet_url"] = result.get("url")
        print(f"[TwitterPublisher] ✅ Published! URL: {result.get('url')}")
    else:
        state["error"] = result.get("reason", "Unknown error")
        print(f"[TwitterPublisher] ❌ Publish failed: {result.get('reason')}")
        
    return state