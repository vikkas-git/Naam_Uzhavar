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
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('\n--- 1. Set Auth & Open Crops Page ---');
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

  await page.goto('http://localhost:5173/buyer-dashboard/crops', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  console.log('\n--- 2. Click Accept on First Crop ---');
  await page.waitForSelector('.buyer-btn-accept', { timeout: 5000 });
  const acceptButtons = await page.$$('.buyer-btn-accept');
  console.log('Found accept buttons:', acceptButtons.length);
  await acceptButtons[0].click();
  await page.waitForTimeout(800);

  console.log('\n--- 3. Click Confirm in Accept Modal ---');
  const modalExists = await page.$('.accept-modal');
  console.log('accept-modal element found:', !!modalExists);

  // If farmer modal or accept modal exists:
  const confirmBtn = await page.$('.accept-modal .buyer-btn-primary, .farmer-modal .buyer-btn-primary, .buyer-modal-footer .buyer-btn-primary');
  console.log('Confirm button found:', !!confirmBtn);
  if (!confirmBtn) {
    const html = await page.content();
    console.log('Page modals snippet:', html.substring(html.indexOf('buyer-modal'), html.indexOf('buyer-modal') + 500));
    throw new Error('Confirm button not found');
  }
  await confirmBtn.click();
  await page.waitForTimeout(800);

  console.log('\n--- 4. Verify Order Confirmed Modal Contents ---');
  const successModal = await page.$('.success-modal');
  if (!successModal) throw new Error('Success modal not visible!');

  const heading = await page.$eval('.success-modal .buyer-success-heading', el => el.innerText.trim());
  console.log('Modal heading:', heading);

  const message = await page.$eval('.success-modal .buyer-success-message', el => el.innerText.trim());
  console.log('Modal message:', message);

  const trackBtn = await page.$('.success-modal .buyer-success-actions button');
  const trackBtnText = trackBtn ? await trackBtn.innerText() : 'none';
  console.log('Action button text:', trackBtnText.trim());

  const buttonsCount = await page.$$eval('.success-modal .buyer-success-actions button', btns => btns.length);
  console.log('Number of action buttons (should be 1):', buttonsCount);

  const hasMetaBox = await page.$('.success-modal .buyer-confirmed-meta-box');
  console.log('Has extra meta box (should be null):', hasMetaBox);

  const shotConfirmed = path.join(outDir, 'order_confirmed_clean.png');
  await page.screenshot({ path: shotConfirmed });
  console.log('Saved screenshot:', shotConfirmed);

  console.log('\n--- 5. Click Track Your Order Button ---');
  await trackBtn.click();
  await page.waitForTimeout(800);
  console.log('Current URL after clicking Track Your Order:', page.url());

  const isTrackPage = page.url().includes('/buyer-dashboard/track');
  console.log('Successfully navigated to Track Delivery:', isTrackPage);

  const shotTrack = path.join(outDir, 'track_delivery_after_confirm.png');
  await page.screenshot({ path: shotTrack });
  console.log('Saved Track Delivery screenshot:', shotTrack);

  await browser.close();

  if (isTrackPage && buttonsCount === 1) {
    console.log('\n>>> All Order Accept & Track Link validations PASSED! <<<');
  } else {
    throw new Error('Validation failed!');
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
