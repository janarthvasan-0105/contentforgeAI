# Fix Substack Playwright Browser Launch

The Substack publishing modal works, but no Playwright browser window opens when **Publish Now** is clicked.

Fix the Substack Playwright flow so that, during **LOCAL development only**, it launches a visible Chromium browser window (`headless: false`) for manual Substack login.

## Requirements

- Do not change any existing publishing flows.
- Do not store Substack passwords or cookies in `.env`.
- Keep Playwright authentication state in `playwright/.auth/` and add it to `.gitignore`.
- Make sure the browser actually launches on the user's local Windows machine.
- Wait for the user to complete Substack login before continuing.
- Keep the existing **Publishing to Substack** modal and progress messages.
- If browser launch fails, show the actual error in the modal instead of leaving the spinner running.
- After login, save the authenticated session securely and continue the publishing flow.
- Do not expose authentication credentials.

## Test

Verify:

**Select Substack → Publish Now → Chromium window opens → Substack login page appears → User logs in → Session is saved → Publishing flow continues.**
