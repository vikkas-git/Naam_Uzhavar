const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
];

const executablePath = chromePaths.find(p => fs.existsSync(p));
const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\48a99437-97a5-4910-97e6-0438d58147c6';

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({
    server: { port: 5196 },
    configFile: path.resolve(__dirname, '../vite.config.js')
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;

  const browser = await chromium.launch({
    headless: true,
    executablePath
  });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  try {
    console.log('1. Logging in as Buyer via Quick Demo...');
    await page.goto(`${baseUrl}/role-select?role=buyer`, { waitUntil: 'networkidle' });
    await page.click('#switch-tab-buyer');
    await page.waitForTimeout(200);
    await page.click('.role-demo-btn.buyer');
    await page.waitForURL('**/buyer-dashboard', { timeout: 6000 });

    console.log('2. Navigating to /buyer-dashboard/crops...');
    await page.goto(`${baseUrl}/buyer-dashboard/crops`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.buyer-filter-toolbar');

    const toolbar = page.locator('.buyer-filter-toolbar');
    await toolbar.screenshot({ path: path.join(outDir, 'mobile-filter-toolbar-fixed.png') });
    console.log('Saved mobile-filter-toolbar-fixed.png');

    // Check full screen view
    await page.screenshot({ path: path.join(outDir, 'mobile-crops-screen-fixed.png') });
    console.log('Saved mobile-crops-screen-fixed.png');

    console.log('3. Clicking Tomato dropdown on mobile...');
    await page.click('#filter-dropdown-tomato');
    await page.waitForTimeout(250);
    await toolbar.screenshot({ path: path.join(outDir, 'mobile-filter-tomato-open-fixed.png') });
    console.log('Saved mobile-filter-tomato-open-fixed.png');

    console.log('4. Selecting Grade A for Tomato...');
    await page.locator('.buyer-filter-menu-item:has-text("Grade A")').click();
    await page.waitForTimeout(300);
    await toolbar.screenshot({ path: path.join(outDir, 'mobile-filter-tomato-grade-a-fixed.png') });
    console.log('Saved mobile-filter-tomato-grade-a-fixed.png');

    console.log('5. Clicking Onion dropdown on mobile...');
    await page.click('#filter-dropdown-onion');
    await page.waitForTimeout(250);
    await toolbar.screenshot({ path: path.join(outDir, 'mobile-filter-onion-open-fixed.png') });
    console.log('Saved mobile-filter-onion-open-fixed.png');

    console.log('6. Resetting to All...');
    await page.locator('.buyer-filter-chips > button:has-text("All")').click();
    await page.waitForTimeout(300);
    await toolbar.screenshot({ path: path.join(outDir, 'mobile-filter-all-reset-fixed.png') });
    console.log('Saved mobile-filter-all-reset-fixed.png');

    console.log('🎉 ALL MOBILE FILTER SCREENSHOTS SAVED!');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
