"""Helper script invoked as a subprocess to render HTML to PNG via Playwright.

Usage: python _pw_helper.py <html_file_path> <output_png_path>

This runs synchronously in its own process, avoiding Windows
ProactorEventLoop issues when called from uvicorn.
"""
import sys
from playwright.sync_api import sync_playwright


def main():
    html_path = sys.argv[1]
    out_path = sys.argv[2]

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1080})
        page.set_content(html_content, wait_until="networkidle")
        page.wait_for_timeout(2500)  # wait for remote images and fonts
        page.screenshot(path=out_path)
        browser.close()


if __name__ == "__main__":
    main()
