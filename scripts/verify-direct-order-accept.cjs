const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const exec = chromePaths.find(p => fs.existsSync(p));
const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\f1ac70c4-24aa-494f-b534-dbe9efe1af1b';

async function run() {
  console.log('>>> Starting direct order accept & track test <<<');
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('\n--- 1. Set Auth & Open Buyer Overview Dashboard ---');
  await page.goto('http://localhost:5173/buyer-login');
  await page.evaluate(() => {
    localStorage.setItem('buyer_current_profile', JSON.stringify({
      id: 'demo-buyer-1',
      fullName: 'Grand Palace Hotel',
      businessName: 'Grand Palace Luxury Hotel',
      buyerType: 'hotel',
      phone: '9840123456',
      city: 'Madurai'
    }));
  });

  await page.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  console.log('\n--- 2. Click Accept on First Crop on Overview ---');
  await page.waitForSelector('.buyer-btn-accept', { timeout: 5000 });
  const acceptButtons = await page.$$('.buyer-btn-accept');
  console.log('Found accept buttons:', acceptButtons.length);
  await acceptButtons[0].click();
  await page.waitForTimeout(600);

  console.log('\n--- 3. Verify Only Order Confirmed Message & Track Your Order Button Displayed ---');
  const successModal = await page.$('.success-modal');
  if (!successModal) throw new Error('Success modal was not displayed!');

  const heading = await page.$eval('.success-modal .buyer-success-heading', el => el.innerText.trim());
  console.log('Modal heading:', heading);
  if (heading !== 'Order Confirmed') {
    throw new Error(`Expected 'Order Confirmed', got '${heading}'`);
  }

  const message = await page.$eval('.success-modal .buyer-success-message', el => el.innerText.trim());
  console.log('Modal message:', message);

  const buttons = await page.$$('.success-modal button');
  console.log('Number of buttons in modal:', buttons.length);
  if (buttons.length !== 1) {
    throw new Error(`Expected exactly 1 button, found ${buttons.length}`);
  }

  const trackBtnText = await buttons[0].innerText();
  console.log('Button text:', trackBtnText.trim());
  if (!trackBtnText.includes('Track Your Order')) {
    throw new Error(`Expected button to be 'Track Your Order', got '${trackBtnText}'`);
  }

  const metaBox = await page.$('.buyer-confirmed-meta-box');
  console.log('Extra meta box present:', !!metaBox);
  if (metaBox) {
    throw new Error('Extra meta box should not be present');
  }

  const shot = path.join(outDir, 'direct_order_accept_modal.png');
  await page.screenshot({ path: shot });
  console.log('Saved modal screenshot to:', shot);

  console.log('\n--- 4. Click Track Your Order Button ---');
  await buttons[0].click();
  await page.waitForTimeout(1000);

  console.log('Current URL after click:', page.url());
  const onTrackPage = page.url().includes('/buyer-dashboard/track');
  console.log('Navigated to Track Delivery page:', onTrackPage);
  if (!onTrackPage) {
    throw new Error('Failed to navigate to track delivery page');
  }

  const shotTrack = path.join(outDir, 'direct_track_navigated.png');
  await page.screenshot({ path: shotTrack });
  console.log('Saved track screenshot to:', shotTrack);

  await browser.close();
  console.log('\n>>> All assertions PASSED! <<<');
}

run().catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
