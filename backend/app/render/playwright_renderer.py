"""Render HTML to PNG using Playwright in a subprocess.

Windows + uvicorn uses ProactorEventLoop which doesn't support nested
subprocess creation from async_playwright. We work around this by
running Playwright in a synchronous subprocess via a small helper script.
"""
import os
import sys
import json
import asyncio
import uuid
import subprocess

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Path to the helper script that runs synchronously
_HELPER_SCRIPT = os.path.join(os.path.dirname(__file__), "_pw_helper.py")


async def render_html_to_png(html: str, filename: str | None = None) -> str:
    """Render an HTML string to a 1080x1080 PNG file.

    Spawns a subprocess to avoid Windows ProactorEventLoop issues.
    """
    if not filename:
        filename = f"{uuid.uuid4().hex}.png"

    out_path = os.path.join(OUTPUT_DIR, filename)
    html_path = os.path.join(OUTPUT_DIR, f"_tmp_{filename}.html")

    # Write HTML to a temp file
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    # Run the helper script in a subprocess using asyncio.to_thread to avoid
    # Windows SelectorEventLoop NotImplementedError with async subprocesses
    def run_sync():
        return subprocess.run(
            [sys.executable, _HELPER_SCRIPT, html_path, out_path],
            capture_output=True,
            text=True
        )

    result = await asyncio.to_thread(run_sync)

    # Clean up temp HTML
    try:
        os.remove(html_path)
    except OSError:
        pass

    if result.returncode != 0:
        raise RuntimeError(f"Playwright render failed: {result.stderr.strip()}")

    return out_path
