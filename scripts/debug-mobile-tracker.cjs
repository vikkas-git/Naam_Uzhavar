const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const exec = chromePaths.find(p => fs.existsSync(p));
const artifactsDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\48a99437-97a5-4910-97e6-0438d58147c6';

async function main() {
  const browser = await chromium.launch({ executablePath: exec, headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Switch to Tamil by clicking language button in topbar
    const langBtn = page.locator('button:has-text("தமிழ்")');
    if (await langBtn.count() > 0) {
      await langBtn.first().click();
      await page.waitForTimeout(400);
    }

    // Scroll down to see buttons
    await page.evaluate(() => {
      const vp = document.querySelector('.buyer-main-viewport');
      if (vp) vp.scrollTop = 280;
    });
    await page.waitForTimeout(400);

    const tamilScrolledPath = path.join(artifactsDir, 'mobile-scrolled-tamil.png');
    await page.screenshot({ path: tamilScrolledPath });
    console.log(`Saved Tamil mobile screenshot: ${tamilScrolledPath}`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
