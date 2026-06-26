import os

SESSION_DIR = "storage/twitter_session"
SESSION_FILE = "twitter_session.json"


def get_twitter_session_path() -> str:
    """Returns the full path to the session storage file."""
    os.makedirs(SESSION_DIR, exist_ok=True)
    return os.path.join(SESSION_DIR, SESSION_FILE)


def session_exists() -> bool:
    """Check if a saved session file exists."""
    return os.path.exists(get_twitter_session_path())


async def save_twitter_session_async(context, session_path: str):
    """
    Saves the current browser context storage state to disk.
    Called after successful login to avoid re-login on future runs.
    """
    os.makedirs(os.path.dirname(session_path), exist_ok=True)
    await context.storage_state(path=session_path)
    print(f"[Session] Session saved to {session_path}")


def save_twitter_session_sync(context, session_path: str):
    """
    Synchronous version of saving browser context storage state to disk.
    """
    os.makedirs(os.path.dirname(session_path), exist_ok=True)
    context.storage_state(path=session_path)
    print(f"[Session] Session saved to {session_path} (sync)")


def delete_session():
    """
    Deletes the saved session file.
    Call this if session is corrupted or login fails repeatedly.
    """
    path = get_twitter_session_path()
    if os.path.exists(path):
        os.remove(path)
        print(f"[Session] Session deleted: {path}")
