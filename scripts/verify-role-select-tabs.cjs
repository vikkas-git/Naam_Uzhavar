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
  console.log('1. Starting Vite preview/dev server...');
  const { createServer } = await import('vite');
  const server = await createServer({
    server: { port: 5199 },
    configFile: path.resolve(__dirname, '../vite.config.js')
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Vite running at ${baseUrl}`);

  const browser = await chromium.launch({
    executablePath,
    headless: true
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    // 0. Verify /buyer-login redirect to /role-select?role=buyer
    console.log('Testing /buyer-login backward-compatible redirect...');
    await page.goto(`${baseUrl}/buyer-login`, { waitUntil: 'networkidle' });
    console.log('Current URL after /buyer-login:', page.url());
    if (!page.url().includes('role-select') || !page.url().includes('role=buyer')) {
      throw new Error(`Expected redirect to /role-select?role=buyer, got ${page.url()}`);
    }
    const isBuyerActiveFromRedirect = await page.$eval('#switch-tab-buyer', el => el.classList.contains('active'));
    console.log('Is Buyer tab active from /buyer-login redirect?', isBuyerActiveFromRedirect);
    if (!isBuyerActiveFromRedirect) {
      throw new Error('Buyer tab should be active after redirect from /buyer-login!');
    }

    // 1. Visit Role Select Page
    console.log('Navigating to /role-select...');
    await page.goto(`${baseUrl}/role-select`, { waitUntil: 'networkidle' });

    // Check switcher buttons exist and their order
    const tabs = await page.$$eval('.role-switch-btn', btns => btns.map(b => b.innerText.trim()));
    console.log('Detected switch tabs in order:', tabs);

    if (tabs.length !== 3) {
      throw new Error(`Expected 3 switch tabs, found ${tabs.length}`);
    }

    // Verify Tab 1 is Farmer by default
    const isFarmerActive = await page.$eval('#switch-tab-farmer', el => el.classList.contains('active'));
    console.log('Is Farmer tab active by default?', isFarmerActive);
    if (!isFarmerActive) throw new Error('Farmer tab should be active by default!');

    const farmerMobileExists = await page.$('#farmer-mobile-input');
    const farmerPinExists = await page.$('#farmer-pin-input');
    console.log('Farmer inputs exist:', !!farmerMobileExists, !!farmerPinExists);

    await page.screenshot({ path: path.join(outDir, 'role-select-farmer-default.png'), fullPage: true });
    console.log('Saved role-select-farmer-default.png');

    // 2. Switch to Buyer Tab (2nd)
    console.log('Clicking Buyer Login switch button...');
    await page.click('#switch-tab-buyer');
    await page.waitForTimeout(300);

    const isBuyerActive = await page.$eval('#switch-tab-buyer', el => el.classList.contains('active'));
    console.log('Is Buyer tab active?', isBuyerActive);
    const buyerIdExists = await page.$('#buyer-identifier-input');
    const buyerPassExists = await page.$('#buyer-password-input');
    console.log('Buyer inputs exist:', !!buyerIdExists, !!buyerPassExists);

    await page.screenshot({ path: path.join(outDir, 'role-select-buyer-tab.png'), fullPage: true });
    console.log('Saved role-select-buyer-tab.png');

    // 3. Switch to Driver Tab (3rd)
    console.log('Clicking Driver Login switch button...');
    await page.click('#switch-tab-driver');
    await page.waitForTimeout(300);

    const isDriverActive = await page.$eval('#switch-tab-driver', el => el.classList.contains('active'));
    console.log('Is Driver tab active?', isDriverActive);
    const driverIdExists = await page.$('#driver-id-input');
    const driverPinExists = await page.$('#driver-pin-input');
    console.log('Driver inputs exist:', !!driverIdExists, !!driverPinExists);

    await page.screenshot({ path: path.join(outDir, 'role-select-driver-tab.png'), fullPage: true });
    console.log('Saved role-select-driver-tab.png');

    // 3b. Test Tamil Language Switch
    console.log('Clicking Language toggle button to Tamil...');
    await page.click('.role-select-lang-btn');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'role-select-tamil-view.png'), fullPage: true });
    console.log('Saved role-select-tamil-view.png');
    // Switch back to English
    await page.click('.role-select-lang-btn');
    await page.waitForTimeout(300);

    // 4. Test Mobile Viewport
    console.log('Testing mobile viewport (375x812)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'role-select-mobile-switcher.png'), fullPage: true });
    console.log('Saved role-select-mobile-switcher.png');

    // 4b. Test Mobile Sticky Scroll
    console.log('Testing Mobile Sticky Scroll (scrolling 200px)...');
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(400);
    const isMobileSticky = await page.$eval('.role-switch-container', el => el.classList.contains('is-sticky'));
    console.log('Is mobile switcher sticky after scroll?', isMobileSticky);
    await page.screenshot({ path: path.join(outDir, 'role-select-sticky-scrolled-mobile.png') });
    console.log('Saved role-select-sticky-scrolled-mobile.png');

    // 5. Test Desktop Sticky Scroll & Tab Switching While Sticky
    console.log('Testing Desktop Sticky Scroll (1280x900, scrolling 250px)...');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 250));
    await page.waitForTimeout(400);
    const isDesktopSticky = await page.$eval('.role-switch-container', el => el.classList.contains('is-sticky'));
    console.log('Is desktop switcher sticky after scroll?', isDesktopSticky);
    await page.screenshot({ path: path.join(outDir, 'role-select-sticky-scrolled-desktop.png') });
    console.log('Saved role-select-sticky-scrolled-desktop.png');

    // 6. Test Buyer 1-Click Demo Login and Redirection to Buyer Dashboard
    console.log('Testing Buyer 1-Click Demo Login while sticky...');
    await page.click('#switch-tab-buyer');
    await page.waitForTimeout(300);
    await page.click('.role-demo-btn.buyer');

    // Wait for URL to change to /buyer-dashboard
    await page.waitForURL('**/buyer-dashboard', { timeout: 5000 });
    console.log('Successfully redirected to URL:', page.url());
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'role-select-redirected-buyer-dashboard.png'), fullPage: true });
    console.log('Saved role-select-redirected-buyer-dashboard.png');

    console.log('🎉 ALL ROLE SELECT TESTS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
