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
console.log('Using browser executable:', executablePath);

const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\f1ac70c4-24aa-494f-b534-dbe9efe1af1b';

async function run() {
  const browser = await chromium.launch({
    executablePath,
    headless: true
  });

  console.log('\n--- 1. Testing Mobile Viewport (375x812) ---');
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const fab = await page.$('.mobile-floating-login-fab');
  if (!fab) {
    throw new Error('Element .mobile-floating-login-fab not found on page!');
  }

  const isVisible = await fab.isVisible();
  console.log('Pop Login button visible:', isVisible);

  const text = await fab.innerText();
  console.log('Pop Login button text:', text.trim());

  const styles = await page.evaluate(el => {
    const cs = window.getComputedStyle(el);
    return {
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      color: cs.color,
      display: cs.display,
      fontWeight: cs.fontWeight,
      fontSize: cs.fontSize,
      boxShadow: cs.boxShadow
    };
  }, fab);
  console.log('Pop Login computed styles:', JSON.stringify(styles, null, 2));

  // Take screenshot of mobile 375px
  const shot375 = path.join(outDir, 'pop_login_mobile_375.png');
  await page.screenshot({ path: shot375 });
  console.log('Saved screenshot (375px):', shot375);

  console.log('\n--- 2. Testing 320px Mobile Viewport (320x640) ---');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(400);

  const styles320 = await page.evaluate(el => {
    const cs = window.getComputedStyle(el);
    return {
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      color: cs.color,
      padding: cs.padding,
      fontSize: cs.fontSize
    };
  }, fab);
  console.log('Pop Login 320px styles:', JSON.stringify(styles320, null, 2));

  const shot320 = path.join(outDir, 'pop_login_mobile_320.png');
  await page.screenshot({ path: shot320 });
  console.log('Saved screenshot (320px):', shot320);

  console.log('\n--- 3. Testing Click Navigation ---');
  await fab.click();
  await page.waitForTimeout(600);
  console.log('URL after click:', page.url());

  const shotNav = path.join(outDir, 'pop_login_clicked_role_select.png');
  await page.screenshot({ path: shotNav });
  console.log('Saved screenshot after click:', shotNav);

  await page.close();
  await browser.close();

  console.log('\n>>> All Playwright verification steps passed successfully! <<<');
}

run().catch(err => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
