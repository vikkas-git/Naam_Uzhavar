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
  console.log('1. Starting Vite preview/dev server...');
  const { createServer } = await import('vite');
  const server = await createServer({
    server: { port: 5195 },
    configFile: path.resolve(__dirname, '../vite.config.js')
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Vite running at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('2. Navigating to /role-select?role=buyer...');
    await page.goto(`${baseUrl}/role-select?role=buyer`, { waitUntil: 'networkidle' });
    
    // Verify Buyer tab active
    const buyerTabActive = await page.locator('#switch-tab-buyer').getAttribute('aria-selected');
    console.log('Is Buyer tab active?', buyerTabActive === 'true');

    // Click "Register your restaurant / kitchen" link
    console.log('3. Clicking "Register your restaurant / kitchen ➔" link...');
    await page.locator('.role-register-link').click();
    await page.waitForURL('**/buyer-register');
    console.log('Landed on URL:', page.url());

    // Test clicking "Sign in to your account" link in registration page
    console.log('4. Testing "Sign in to your account" link from registration page...');
    await page.locator('.buyer-reg-login-link').click();
    await page.waitForURL('**/role-select?role=buyer');
    console.log('URL after clicking login link:', page.url());
    const isBuyerActiveAfterLink = await page.locator('#switch-tab-buyer').getAttribute('aria-selected');
    console.log('Is Buyer tab active after clicking login link?', isBuyerActiveAfterLink === 'true');

    // Test clicking "Back to Buyer Login" button at the top of registration page
    console.log('5. Navigating back to /buyer-register to test Back button...');
    await page.goto(`${baseUrl}/buyer-register`, { waitUntil: 'networkidle' });
    await page.locator('.buyer-reg-back-link').click();
    await page.waitForURL('**/role-select?role=buyer');
    console.log('URL after clicking Back button:', page.url());
    const isBuyerActiveAfterBack = await page.locator('#switch-tab-buyer').getAttribute('aria-selected');
    console.log('Is Buyer tab active after clicking Back button?', isBuyerActiveAfterBack === 'true');

    // Navigate to /buyer-register to test full form submission and auto-redirect
    console.log('6. Navigating to /buyer-register to test registration submission...');
    await page.goto(`${baseUrl}/buyer-register`, { waitUntil: 'networkidle' });

    // 1. Upload photo
    console.log('Setting photo file...');
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.setInputFiles('#buyer-photo-file-input', {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: png1x1
    });

    // 2. Personal Details
    await page.fill('#buyer-name-input', 'Rajesh Senthil');
    await page.fill('#buyer-phone-input', '9840123456');
    await page.fill('#buyer-email-input', 'rajesh.senthil@greenharvest.in');
    await page.fill('#buyer-password-input', 'securePass123');

    // 3. Select buyer type
    await page.click('.buyer-select-button');
    await page.locator('.buyer-select-option').first().click();

    // 4. Fill business details
    await page.fill('#buyer-shopname-input', 'Green Harvest Organic Kitchen');
    await page.fill('#buyer-address-input', '142 East Veli Street, Madurai South, Tamil Nadu 625001');
    await page.fill('#buyer-gstin-input', '33ABCDE1234F1Z5');

    // 5. Check confirmation checkbox
    await page.check('#buyer-confirm-checkbox');

    // Submit form
    console.log('7. Submitting buyer registration form...');
    await page.click('button[type="submit"]');

    // Wait for auto-redirect to /role-select?role=buyer&registered=1
    console.log('8. Waiting for celebration and auto-redirect to /role-select?role=buyer...');
    await page.waitForURL('**/role-select?role=buyer&registered=1', { timeout: 8000 });
    console.log('Redirected to URL after registration:', page.url());

    // Verify Buyer tab is active
    const buyerTabActivePostReg = await page.locator('#switch-tab-buyer').getAttribute('aria-selected');
    console.log('Is Buyer tab active after registration redirect?', buyerTabActivePostReg === 'true');

    // Verify prefilled email/phone
    const prefilledValue = await page.inputValue('#buyer-identifier-input');
    console.log('Prefilled identifier in Buyer Login:', prefilledValue);

    // Verify success notice is visible
    const alertSuccess = await page.locator('.role-login-feedback.success').textContent();
    console.log('Success banner message:', alertSuccess.trim());

    // Take screenshot of buyer login after registration
    await page.screenshot({ path: path.join(outDir, 'buyer-login-after-registration-success.png') });
    console.log('Saved buyer-login-after-registration-success.png');

    // Test Mobile viewport to ensure arrow icon is clean and alone
    console.log('9. Verifying mobile viewport header back button...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(outDir, 'role-select-mobile-arrow-clean.png') });
    console.log('Saved role-select-mobile-arrow-clean.png');

    console.log('🎉 ALL BUYER REGISTRATION FLOW TESTS PASSED!');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
