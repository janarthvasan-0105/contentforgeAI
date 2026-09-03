import { chromium } from 'playwright';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';

// Fix paths for Next.js API route execution context
const AUTH_DIR = path.resolve(process.cwd(), 'playwright/.auth');
const AUTH_PATH = path.join(AUTH_DIR, 'substack_auth.json');

// Helper to ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export async function publishToSubstack({ title, content, cookie }: any, onStatusChange: any) {
    const notify = (status: string, details = '') => {
        console.log(`[Substack Publisher] ${status}: ${details}`);
        if (onStatusChange) onStatusChange(status, details);
    };

    let browser: any = null;
    let context: any = null;
    let page: any = null;
    let isAuthenticated = false;

    // Launch arguments to ensure Chromium launches reliably on Windows
    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check'
    ];

    try {
        // 0. If manual cookie is provided, write it to auth state immediately
        if (cookie && cookie.trim().length > 0) {
            notify('MANUAL_COOKIE', 'Injecting manually provided Substack session cookie...');
            const storageState = {
                cookies: [
                    {
                        name: 'connect.sid',
                        value: cookie.trim(),
                        domain: '.substack.com',
                        path: '/',
                        expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
                        httpOnly: true,
                        secure: true,
                        sameSite: 'Lax'
                    },
                    {
                        name: 'substack.sid',
                        value: cookie.trim(),
                        domain: '.substack.com',
                        path: '/',
                        expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
                        httpOnly: true,
                        secure: true,
                        sameSite: 'Lax'
                    }
                ],
                origins: []
            };
            fs.writeFileSync(AUTH_PATH, JSON.stringify(storageState, null, 2), 'utf8');
        }

        // 1. Check if auth session exists (either existing or newly written above)
        if (fs.existsSync(AUTH_PATH)) {
            try {
                notify('INIT_SESSION', 'Loading Substack session...');
                browser = await chromium.launch({
                    headless: true,
                    args: launchArgs
                });
                context = await browser.newContext({ storageState: AUTH_PATH });
                page = await context.newPage();
                
                // Navigate directly to the editor to check auth.
                // If we are authenticated, the editor page should load and have contenteditable editors.
                await page.goto('https://substack.com/publish/post', { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForTimeout(2000);
                
                const contenteditables = await page.locator('[contenteditable]').count();
                const url = page.url();
                
                if (contenteditables > 0 && !url.includes('/sign-in') && !url.includes('/signup')) {
                    isAuthenticated = true;
                    notify('AUTH_SUCCESS', 'Authenticated successfully using Substack session.');
                } else {
                    notify('SESSION_EXPIRED', 'Substack session is expired or invalid (editor did not load).');
                    await browser.close();
                    browser = null;
                }
            } catch (err: any) {
                notify('SESSION_ERROR', `Error loading session: ${err.message}`);
                if (browser) {
                    await browser.close();
                    browser = null;
                }
            }
        } else {
            notify('NO_SESSION', 'No Substack session found.');
        }

        // 2. If not authenticated, open headed browser and let user log in manually
        if (!isAuthenticated) {
            // If a manual cookie was passed but validation failed, don't open headed browser (which will just hang)
            if (cookie && cookie.trim().length > 0) {
                throw new Error('The provided Substack session cookie is invalid or expired. Please check that you copied the complete value of substack.sid.');
            }

            notify('AWAITING_LOGIN', 'Opening browser for manual login. Please sign in to Substack...');
            
            try {
                browser = await chromium.launch({
                    headless: false,
                    args: launchArgs
                });
                context = await browser.newContext();
                page = await context.newPage();
            } catch (launchErr: any) {
                console.error('[Substack Publisher] Failed to launch headed browser:', launchErr);
                throw new Error(`Failed to launch browser: ${launchErr.message}. If headless environment, please enter your session cookie manually.`);
            }
            
            await page.goto('https://substack.com/sign-in', { timeout: 60000 });
            
            // Wait for manual login: check if we get to a page that has contenteditable elements (the editor).
            let loginTimeout = 300000; // 5 minutes
            let checkInterval = 2000;
            let elapsed = 0;
            
            while (elapsed < loginTimeout) {
                const cookies = await context.cookies();
                const hasSession = cookies.some((c: any) => c.name === 'connect.sid' || c.name === 'substack.sid');
                const currentUrl = page.url();
                
                // If they are on a page with a session cookie and not signin/signup
                if (hasSession && !currentUrl.includes('/sign-in') && !currentUrl.includes('/signup')) {
                    // Try to navigate to publish/post to see if editor is accessible
                    try {
                        await page.goto('https://substack.com/publish/post', { timeout: 10000 });
                        await page.waitForTimeout(2000);
                        const contenteditables = await page.locator('[contenteditable]').count();
                        if (contenteditables > 0) {
                            isAuthenticated = true;
                            break;
                        }
                    } catch (e) {
                        // Ignore and keep waiting
                    }
                }
                
                await page.waitForTimeout(checkInterval);
                elapsed += checkInterval;
            }

            if (!isAuthenticated) {
                throw new Error('Authentication timed out or was cancelled by user.');
            }

            notify('LOGIN_SUCCESS', 'Successfully logged in manually! Saving session state...');
            await context.storageState({ path: AUTH_PATH });
        }

        // 3. Create and publish the post
        notify('NAVIGATING_EDITOR', 'Navigating to post editor...');
        
        // We are already on the editor if we authenticated in step 1 or 2, but let's make sure
        const currentUrl = page.url();
        if (!currentUrl.includes('/publish/post') && !(await page.locator('[contenteditable]').count() > 0)) {
            await page.goto('https://substack.com/publish/post', { waitUntil: 'networkidle', timeout: 60000 });
        }
        
        notify('PREPARING_POST', 'Filling in blog title and body...');
        
        // Locate Title field
        const titleSelectors = [
            'textarea[placeholder="Title"]',
            'input[placeholder="Title"]',
            '.post-title',
            '[data-placeholder="Title"]',
            'div[contenteditable="true"] >> xpath=.. >> textarea[placeholder="Title"]'
        ];
        
        let titleEl = null;
        for (const sel of titleSelectors) {
            try {
                const el = page.locator(sel);
                if (await el.count() > 0 && await el.isVisible()) {
                    titleEl = el;
                    break;
                }
            } catch (e) {}
        }

        if (!titleEl) {
            titleEl = page.locator('div[contenteditable="true"]').first();
        }

        await titleEl.click();
        await titleEl.fill('');
        await titleEl.fill(title);

        // Locate Body field (ProseMirror editor)
        const bodySelectors = [
            '.ProseMirror',
            'div[contenteditable="true"].ProseMirror',
            'div[role="textbox"]',
            '#editor-body'
        ];

        let bodyEl = null;
        for (const sel of bodySelectors) {
            try {
                const el = page.locator(sel);
                if (await el.count() > 0 && await el.isVisible()) {
                    bodyEl = el;
                    break;
                }
            } catch (e) {}
        }

        if (!bodyEl) {
            const divs = page.locator('div[contenteditable="true"]');
            if (await divs.count() > 1) {
                bodyEl = divs.nth(1);
            } else {
                bodyEl = divs.first();
            }
        }

        // Convert Markdown content to HTML
        const htmlContent = marked.parse(content);

        // Insert HTML into the ProseMirror editor
        await bodyEl.click();
        await page.evaluate(({ selector, html }: any) => {
            const el = document.querySelector(selector) || document.querySelectorAll('div[contenteditable="true"]')[1] || document.querySelector('div[contenteditable="true"]');
            if (el) {
                el.innerHTML = html;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, { selector: bodySelectors[0], html: htmlContent });

        await page.waitForTimeout(2000);

        notify('PUBLISHING', 'Clicking publish button...');
        const publishButtonSelectors = [
            'button:has-text("Publish")',
            'button.publish-button',
            'button:has-text("Continue")',
            'button:has-text("Publish Now")'
        ];

        let publishBtn = null;
        for (const sel of publishButtonSelectors) {
            try {
                const el = page.locator(sel);
                if (await el.count() > 0 && await el.isVisible()) {
                    publishBtn = el;
                    break;
                }
            } catch (e) {}
        }

        if (!publishBtn) {
            publishBtn = page.getByRole('button', { name: /Publish/i }).first();
        }

        await publishBtn.click();
        await page.waitForTimeout(3000);

        notify('CONFIRMING_PUBLISH', 'Confirming and sending to audience...');
        const confirmSelectors = [
            'button:has-text("Send to everyone now")',
            'button:has-text("Publish now")',
            'button:has-text("Send to everyone")',
            'button.confirm-button',
            'button:has-text("Publish")'
        ];

        let confirmBtn = null;
        for (const sel of confirmSelectors) {
            try {
                const el = page.locator(sel);
                if (await el.count() > 0 && await el.isVisible()) {
                    confirmBtn = el;
                    break;
                }
            } catch (e) {}
        }

        if (!confirmBtn) {
            confirmBtn = page.getByRole('button', { name: /Send to everyone now|Publish now/i }).first();
        }

        await confirmBtn.click();
        
        notify('FINALIZING', 'Waiting for publication confirmation...');
        await page.waitForTimeout(5000);

        // Get final URL
        const finalUrl = page.url();
        notify('PUBLISH_COMPLETE', `Post published successfully! URL: ${finalUrl}`);
        
        await browser.close();
        browser = null;
        
        return {
            success: true,
            url: finalUrl
        };
    } catch (error: any) {
        notify('PUBLISH_FAILED', `Failed to publish post: ${error.message}`);
        if (browser) {
            try {
                await browser.close();
            } catch (e) {}
        }
        throw error;
    }
}
