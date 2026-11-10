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
    server: { port: 5197 },
    configFile: path.resolve(__dirname, '../vite.config.js')
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;

  const browser = await chromium.launch({
    headless: true,
    executablePath
  });

  // Test standard mobile sizes: 360px, 375px, 390px
  for (const width of [360, 375]) {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/role-select?role=buyer`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.role-switch-container');

    // 1. Initial unscrolled state
    await page.screenshot({ path: path.join(outDir, `role-select-unscrolled-${width}.png`) });

    // 2. Scroll down to trigger sticky
    await page.evaluate(() => window.scrollTo(0, 180));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `role-select-scrolled-${width}.png`) });

    // Get bounding boxes of container, switcher, pill
    const metrics = await page.evaluate(() => {
      const switcher = document.querySelector('.role-switch-container');
      const pill = document.querySelector('.role-switch-pill');
      const container = document.querySelector('.role-select-container');
      return {
        windowWidth: window.innerWidth,
        rootScrollWidth: document.documentElement.scrollWidth,
        switcher: switcher ? switcher.getBoundingClientRect() : null,
        pill: pill ? pill.getBoundingClientRect() : null,
        container: container ? container.getBoundingClientRect() : null,
      };
    });
    console.log(`Width ${width} metrics:`, JSON.stringify(metrics, null, 2));

    await context.close();
  }

  await browser.close();
  await server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

