const { chromium } = require('playwright-core');
const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const fs = require('fs');
const exec = chromePaths.find(p => fs.existsSync(p));

async function run() {
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Step 1: Open role-select
  await page.goto('http://localhost:5173/role-select');
  console.log('1. On role-select');

  // Step 2: Click buyer card button
  await page.click('.role-select-card.buyer-theme');
  await page.waitForTimeout(600);
  console.log('2. After clicking buyer card, URL is:', page.url());

  // Step 3: We should be on /buyer-login
  await page.fill('#buyer-identifier', 'procurement@grandpalace.in');
  await page.fill('#buyer-password', 'Pass@1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1600);
  console.log('3. After clicking Login submit, URL is:', page.url());

  // Check what is rendered on dashboard
  const heading = await page.$eval('h1, h2, .buyer-view-title', el => el ? el.textContent.trim() : 'none').catch(() => 'none');
  console.log('Dashboard heading:', heading);

  // Step 4: Click Crops link
  const cropsLink = await page.$('a[href*="crops"]');
  if (cropsLink) {
    await cropsLink.click();
    await page.waitForTimeout(800);
    console.log('4. After clicking Crops, URL is:', page.url());
    const cropsTitle = await page.$eval('.buyer-view-title', el => el ? el.textContent.trim() : 'none').catch(() => 'none');
    console.log('Crops title:', cropsTitle);
  }

  // Step 5: Click Orders link
  const ordersLink = await page.$('a[href*="orders"]');
  if (ordersLink) {
    await ordersLink.click();
    await page.waitForTimeout(800);
    console.log('5. After clicking Orders, URL is:', page.url());
  }

  // Step 6: Click Track link
  const trackLink = await page.$('a[href*="track"]');
  if (trackLink) {
    await trackLink.click();
    await page.waitForTimeout(800);
    console.log('6. After clicking Track, URL is:', page.url());
  }

  await browser.close();
}

run().catch(console.error);
