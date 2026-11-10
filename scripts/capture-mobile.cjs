const fs = require('fs');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
];

const executablePath = chromePaths.find(p => fs.existsSync(p));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath
  });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/buyer-login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('buyer_current_profile', JSON.stringify({
      name: 'Grand Palace Hotel',
      shopName: 'Grand Palace Luxury Dining',
      role: 'buyer'
    }));
  });
  await page.goto('http://localhost:5173/buyer-dashboard/invoices', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/84e16d3e-4fe1-4ba3-84bb-c27b6491b831/mobile_invoices_view.png', fullPage: true });
  await browser.close();
  console.log('Mobile invoices screenshot saved successfully');
})();
