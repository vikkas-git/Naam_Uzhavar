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
const BASE_URL = 'http://localhost:5173';

async function run() {
  console.log('Verifying absence of decline buttons in buyer portal...');
  const browser = await chromium.launch({ executablePath, headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE_URL + '/buyer-login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('buyer_current_profile', JSON.stringify({
        name: 'Grand Palace Hotel',
        shopName: 'Grand Palace Luxury Dining',
        role: 'buyer'
      }));
    });

    // 1. Check Overview page
    await page.goto(BASE_URL + '/buyer-dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.buyer-crop-card');
    const overviewDeclineCount = await page.$$eval('.buyer-btn-decline', els => els.length);
    const overviewAcceptCount = await page.$$eval('.buyer-btn-accept', els => els.length);
    console.log(`Overview - Decline buttons found: ${overviewDeclineCount} (Expected: 0)`);
    console.log(`Overview - Accept buttons found: ${overviewAcceptCount} (Expected: > 0)`);

    if (overviewDeclineCount !== 0) {
      throw new Error(`Found ${overviewDeclineCount} decline buttons on Overview page!`);
    }

    // 2. Check Crops Marketplace page
    await page.goto(BASE_URL + '/buyer-dashboard/crops', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.buyer-crop-card');
    const cropsDeclineCount = await page.$$eval('.buyer-btn-decline', els => els.length);
    const cropsAcceptCount = await page.$$eval('.buyer-btn-accept', els => els.length);
    console.log(`Crops Marketplace - Decline buttons found: ${cropsDeclineCount} (Expected: 0)`);
    console.log(`Crops Marketplace - Accept buttons found: ${cropsAcceptCount} (Expected: > 0)`);

    if (cropsDeclineCount !== 0) {
      throw new Error(`Found ${cropsDeclineCount} decline buttons on Crops Marketplace page!`);
    }

    // Capture screenshot of Crops Marketplace
    const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/84e16d3e-4fe1-4ba3-84bb-c27b6491b831';
    await page.screenshot({ path: `${artifactDir}/buyer_crops_no_decline.png` });

    console.log('\n======================================================');
    console.log('🎉 VERIFICATION SUCCESS: ZERO DECLINE BUTTONS IN BUYER PORTAL!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
