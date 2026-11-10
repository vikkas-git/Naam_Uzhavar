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
const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\1b25d999-b2af-43d5-9c13-5700e3ade86c';

async function run() {
  const browser = await chromium.launch({
    executablePath,
    headless: true
  });

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.evaluate(() => localStorage.removeItem('buyer_current_profile'));
  await desktopPage.goto('http://localhost:5173/buyer-login', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(400);

  const desktopPath = path.join(outDir, 'buyer_login_fixed_desktop.png');
  await desktopPage.screenshot({ path: desktopPath });
  console.log('Saved:', desktopPath);

  // Mobile
  const mobContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobPage = await mobContext.newPage();
  await mobPage.goto('http://localhost:5173/buyer-login', { waitUntil: 'networkidle' });
  await mobPage.waitForTimeout(400);

  const mobPath = path.join(outDir, 'buyer_login_fixed_mobile.png');
  await mobPage.screenshot({ path: mobPath });
  console.log('Saved:', mobPath);

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
