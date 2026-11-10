const { chromium } = require('playwright-core');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function checkBadgeGap() {
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.goto('http://localhost:5173/buyer/login', { waitUntil: 'networkidle' });
  await page.fill('#buyer-identifier', 'procurement@grandpalace.in');
  await page.fill('#buyer-password', 'Pass@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/buyer-dashboard**');
  await page.waitForSelector('.buyer-sidebar-nav');

  const navItems = await page.$$('.buyer-sidebar-nav .buyer-nav-item');
  console.log(`Found ${navItems.length} desktop nav items.`);

  for (const item of navItems) {
    const label = await item.$('.buyer-nav-label');
    const badge = await item.$('.buyer-nav-badge, .buyer-nav-dot-pulse');
    if (label && badge) {
      const labelText = await label.textContent();
      const labelBox = await label.boundingBox();
      const badgeBox = await badge.boundingBox();
      const gap = badgeBox.x - (labelBox.x + labelBox.width);
      console.log(`Nav item "${labelText.trim()}": gap between text and badge is ${gap.toFixed(1)}px (label right: ${(labelBox.x + labelBox.width).toFixed(1)}, badge left: ${badgeBox.x.toFixed(1)})`);
    }
  }

  await page.screenshot({ path: 'scripts/sidebar-gap-verified.png' });
  console.log('Saved screenshot to scripts/sidebar-gap-verified.png');
  await browser.close();
}

checkBadgeGap().catch(console.error);
