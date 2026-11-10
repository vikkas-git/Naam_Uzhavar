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

async function run() {
  console.log('Launching browser with:', executablePath);
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.message}`);
  });

  const mockProfile = {
    name: 'Grand Palace Hotel',
    shopName: 'Grand Palace Luxury Dining',
    businessName: 'Grand Palace Luxury Dining',
    contactPerson: 'Mr. S. Rajesh',
    phone: '+91 98401 23456',
    email: 'procurement@grandpalace.in',
    buyerType: 'hotel',
    businessType: 'Hotel & Commercial Kitchen',
    address: 'Madurai Bypass Road',
    gstin: '33AAAAA0000A1Z5',
    verified: true
  };

  // 1. Test Public Routes (Guest)
  const publicRoutes = ['/', '/role-select', '/buyer-login', '/buyer-register'];
  for (const route of publicRoutes) {
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('buyer_current_profile'));
    await page.waitForTimeout(300);
    const title = await page.title();
    console.log(`✓ Visited ${route} - Title: "${title}"`);
  }

  // 2. Set Profile in LocalStorage for Dashboard Routes
  await page.evaluate((p) => {
    localStorage.setItem('buyer_current_profile', JSON.stringify(p));
  }, mockProfile);

  const dashboardRoutes = [
    '/buyer-dashboard',
    '/buyer-dashboard/crops',
    '/buyer-dashboard/orders',
    '/buyer-dashboard/track',
    '/buyer-dashboard/invoices',
    '/buyer-dashboard/profile'
  ];

  for (const route of dashboardRoutes) {
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const heading = await page.$eval('h1, h2, .buyer-view-title, .buyer-brand-logo-text', el => el ? el.textContent.trim() : 'N/A').catch(() => 'rendered');
    console.log(`✓ Visited ${route} - Heading/Content: "${heading}"`);
  }

  await browser.close();

  if (errors.length > 0) {
    console.error('FAILED with errors:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('\nALL 10 ROUTES PASSED WITH ZERO CONSOLE ERRORS!\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
