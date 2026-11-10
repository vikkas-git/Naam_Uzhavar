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
console.log('Found browser executable:', executablePath);

const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\1b25d999-b2af-43d5-9c13-5700e3ade86c';

async function run() {
  const browser = await chromium.launch({
    executablePath,
    headless: true
  });

  const viewports = [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height }
    });

    console.log(`Testing ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalOverflow = scrollWidth > clientWidth;
    console.log(`[${vp.name}] scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}, overflow: ${hasHorizontalOverflow}`);

    // Take screenshot
    const shotPath = path.join(outDir, `homepage_${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Saved screenshot: ${shotPath}`);

    // Test Tamil translation on desktop
    if (vp.name === 'desktop') {
      const desktopLangBtn = await page.$('.d-none.d-lg-flex button[aria-label="Toggle Language"]');
      if (desktopLangBtn) {
        await desktopLangBtn.click();
        await page.waitForTimeout(400);
        const taShot = path.join(outDir, `homepage_desktop_tamil.png`);
        await page.screenshot({ path: taShot, fullPage: true });
        console.log(`Saved Tamil screenshot: ${taShot}`);
      }
    }

    // On mobile, test clicking 'Get Started' button or Login to ensure navigation
    if (vp.name === 'mobile') {
      const getStartedBtn = await page.$('.hp-btn-primary');
      if (getStartedBtn) {
        await getStartedBtn.click();
        await page.waitForTimeout(600);
        console.log('Current URL after Get Started click:', page.url());
        const roleSelectShot = path.join(outDir, `role_select_mobile.png`);
        await page.screenshot({ path: roleSelectShot, fullPage: true });
        console.log(`Saved Role Select Mobile screenshot: ${roleSelectShot}`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('Responsive testing completed successfully!');
}

run().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
