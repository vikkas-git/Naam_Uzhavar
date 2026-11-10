const { chromium } = require('playwright-core');
const fs = require('fs');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const exec = chromePaths.find(p => fs.existsSync(p));

if (!exec) {
  console.error('No suitable browser found.');
  process.exit(1);
}

async function verify() {
  console.log('Launching browser with Playwright:', exec);
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  // Navigate to buyer login
  console.log('1. Navigating to Buyer Login...');
  await page.goto('http://localhost:5173/buyer/login', { waitUntil: 'networkidle' });

  // Fill credentials and log in
  console.log('2. Logging in...');
  await page.fill('#buyer-identifier', 'procurement@grandpalace.in');
  await page.fill('#buyer-password', 'Pass@1234');
  await page.click('button[type="submit"]');

  // Wait for dashboard navigation
  await page.waitForURL('**/buyer-dashboard**', { timeout: 10000 });
  console.log('3. Successfully navigated to Buyer Dashboard! Current URL:', page.url());

  // Wait for topbar to render
  await page.waitForSelector('.buyer-topbar', { timeout: 5000 });

  // 1. Check Notification Bell button: SHOULD BE GONE
  const notifBtn = await page.$('.buyer-topbar-notif-wrap, button[aria-label="Notifications"], .buyer-icon-circle-btn');
  console.log('Notification button exists in DOM:', !!notifBtn);
  if (!notifBtn) {
    console.log('SUCCESS: Notification button is completely removed from the topbar!');
  } else {
    console.error('FAIL: Notification button is still in the DOM.');
  }

  // 2. Check Profile Full Name visibility on desktop
  const fullNameEl = await page.$('.buyer-profile-full-name');
  if (fullNameEl) {
    const isVisible = await fullNameEl.isVisible();
    const text = await fullNameEl.textContent();
    const box = await fullNameEl.boundingBox();
    console.log(`Profile Full Name element found: "${text.trim()}", visible: ${isVisible}, box:`, box);
    if (isVisible && text.trim().length > 0) {
      console.log('SUCCESS: Profile full name is clearly visible on desktop!');
    } else {
      console.error('FAIL: Profile full name is not visible or empty.');
    }
  } else {
    console.error('FAIL: .buyer-profile-full-name element not found.');
  }

  // Also check role subtext (business/shop name)
  const roleSubtext = await page.$eval('.buyer-role-subtext', el => el ? el.textContent.trim() : 'none').catch(() => 'none');
  console.log('Profile Business/Role Subtext:', roleSubtext);

  // Take desktop screenshot
  await page.screenshot({ path: 'scripts/desktop-topbar-verified.png' });
  console.log('Saved desktop screenshot to scripts/desktop-topbar-verified.png');

  // 3. Test Mobile Viewport
  console.log('4. Testing Mobile Viewport (375x667)...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);

  const mobileNotif = await page.$('.buyer-topbar-notif-wrap, button[aria-label="Notifications"], .buyer-icon-circle-btn');
  console.log('Mobile Notification button exists:', !!mobileNotif);

  const mobileFullNameEl = await page.$('.buyer-profile-full-name');
  if (mobileFullNameEl) {
    const isMobileVisible = await mobileFullNameEl.isVisible();
    const mobileText = await mobileFullNameEl.textContent();
    console.log(`Mobile Profile Full Name: "${mobileText.trim()}", visible: ${isMobileVisible}`);
  }

  await page.screenshot({ path: 'scripts/mobile-topbar-verified.png' });
  console.log('Saved mobile screenshot to scripts/mobile-topbar-verified.png');

  await browser.close();
  console.log('Playwright test completed successfully!');
}

verify().catch(err => {
  console.error('Playwright verification error:', err);
  process.exit(1);
});
