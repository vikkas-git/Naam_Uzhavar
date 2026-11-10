const { chromium } = require('playwright-core');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/buyer-login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('buyer_current_profile'));

  console.log('1. On buyer-login');
  await page.fill('#buyer-identifier', '9840123456');
  await page.fill('#buyer-password', 'Pass@1234');
  console.log('2. Filled form');

  await page.click('button[type="submit"]');
  console.log('3. Clicked submit button');

  // Track URL over the next 3 seconds
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500);
    console.log(`URL at +${(i + 1) * 500}ms:`, page.url());
  }

  const localStorageItem = await page.evaluate(() => localStorage.getItem('buyer_current_profile'));
  console.log('localStorage buyer_current_profile:', localStorageItem ? 'SET' : 'NULL');

  await browser.close();
}

run().catch(console.error);
