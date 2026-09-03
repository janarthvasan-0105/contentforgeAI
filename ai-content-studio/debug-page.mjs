import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_PATH = path.resolve(__dirname, 'playwright/.auth/substack_auth.json');
const SCREENSHOT_PATH = 'C:/Users/Indhu Meenaakshi/.gemini/antigravity-ide/brain/e5db45ef-c6fd-46ff-a7c5-22b5d242c376/substack_debug.png';

async function debug() {
    console.log('Starting debug browser...');
    if (!fs.existsSync(AUTH_PATH)) {
        console.error('No auth session found at', AUTH_PATH);
        return;
    }
    
    // Read the file content
    const authState = JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8'));
    console.log('Auth cookies in file:', authState.cookies.map(c => ({ name: c.name, valueLength: c.value.length, domain: c.domain })));

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
    ];

    const browser = await chromium.launch({ headless: true, args: launchArgs });
    const context = await browser.newContext({ storageState: AUTH_PATH });
    const page = await context.newPage();
    
    try {
        console.log('Navigating to publish/post...');
        await page.goto('https://substack.com/publish/post', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('Final URL after navigation:', page.url());
        
        await page.waitForTimeout(3000);
        
        const contenteditables = await page.locator('[contenteditable]').count();
        console.log('Number of contenteditable elements:', contenteditables);
        
        // Take screenshot
        await page.screenshot({ path: SCREENSHOT_PATH });
        console.log('Screenshot saved.');
        
        // Print page body text
        const bodyText = await page.innerText('body');
        console.log('--- Page text (first 400 chars) ---');
        console.log(bodyText.substring(0, 400));
        
        // Check what cookies exist in the browser context now
        const browserCookies = await context.cookies();
        console.log('Cookies currently in browser:', browserCookies.map(c => ({ name: c.name, domain: c.domain, path: c.path })));
    } catch (e) {
        console.error('Error during debug:', e);
    } finally {
        await browser.close();
    }
}

debug();
