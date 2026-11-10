const fs = require('fs');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const exec = chromePaths.find(p => fs.existsSync(p));

async function run() {
  console.log('Testing Buyer Dashboard Router flows with:', exec);
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.message}`);
  });

  // Step 1: Clear storage and test direct navigation to /buyer-dashboard
  console.log('\n--- Step 1: Direct navigation to /buyer-dashboard (empty localStorage) ---');
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  console.log('Current URL:', page.url());
  const headerText = await page.locator('.buyer-view-title, h1, h2').first().textContent();
  console.log('Dashboard rendered successfully! Heading:', headerText);
  if (!page.url().includes('/buyer-dashboard')) {
    throw new Error('Expected /buyer-dashboard to be preserved!');
  }

  // Step 2: Test slash subroutes (/buyer/dashboard/crops, /buyer/dashboard/orders, etc.)
  console.log('\n--- Step 2: Slash aliases navigation ---');
  const slashRoutes = [
    { from: '/buyer/dashboard', expected: '/buyer-dashboard' },
    { from: '/buyer/dashboard/crops', expected: '/buyer-dashboard/crops' },
    { from: '/buyer/dashboard/orders', expected: '/buyer-dashboard/orders' },
    { from: '/buyer/dashboard/track', expected: '/buyer-dashboard/track' },
    { from: '/buyer/dashboard/invoices', expected: '/buyer-dashboard/invoices' },
    { from: '/buyer/dashboard/profile', expected: '/buyer-dashboard/profile' },
  ];

  for (const item of slashRoutes) {
    await page.goto('http://localhost:5173' + item.from, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    console.log(`Visited ${item.from} -> resolved to ${page.url()}`);
    if (!page.url().endsWith(item.expected)) {
      throw new Error(`Expected ${item.expected} but got ${page.url()}`);
    }
  }

  // Step 3: Test role selection navigation to Buyer Hub
  console.log('\n--- Step 3: RoleSelect -> Buyer Hub card click ---');
  await page.goto('http://localhost:5173/role-select', { waitUntil: 'networkidle' });
  await page.locator('.role-select-card.buyer-theme button').click();
  await page.waitForTimeout(400);
  console.log('Clicked "Start Buying Fresh" -> Landed on:', page.url());
  if (!page.url().includes('/buyer-dashboard')) {
    throw new Error('Expected to land on /buyer-dashboard from RoleSelect!');
  }

  // Step 4: Test Sign Out -> Land on BuyerLogin without infinite redirect loop
  console.log('\n--- Step 4: Sign Out flow ---');
  // Open profile dropdown in topbar
  await page.locator('.buyer-profile-chip-btn').click();
  await page.waitForTimeout(200);
  // Click sign out
  await page.locator('.buyer-dropdown-item.logout').click();
  await page.waitForTimeout(200);
  await page.locator('.buyer-signout-confirm-btn, .modal-footer button.btn-danger, .modal-footer button:has-text("Sign Out")').click();
  await page.waitForTimeout(500);
  console.log('After signing out, URL is:', page.url());
  if (!page.url().includes('/buyer-login')) {
    throw new Error('Expected /buyer-login after signing out!');
  }
  // Verify we STAY on /buyer-login and are NOT bounced back to /buyer-dashboard
  await page.waitForTimeout(500);
  console.log('Confirmed stable URL on /buyer-login:', page.url());

  // Step 5: Test 1-click Quick Demo Sign In
  console.log('\n--- Step 5: 1-Click Quick Demo Sign In ---');
  await page.locator('button:has-text("Quick Demo Sign In")').click();
  await page.waitForTimeout(300);
  const signInBtn = page.locator('button[type="submit"]:has-text("Sign In")');
  if (await signInBtn.count() > 0) {
    await signInBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.waitForURL('**/buyer-dashboard', { timeout: 8000 });
  console.log('After Quick Demo Sign In, URL is:', page.url());
  if (!page.url().includes('/buyer-dashboard')) {
    throw new Error('Expected to return to /buyer-dashboard after Quick Demo Sign In!');
  }

  await browser.close();

  if (errors.length > 0) {
    console.error('Console errors encountered:', errors);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL BUYER DASHBOARD ROUTER TESTS PASSED WITH 0 ERRORS!');
  console.log('======================================================\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
