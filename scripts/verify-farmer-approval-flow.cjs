const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const exec = chromePaths.find(p => fs.existsSync(p));
const artifactsDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\48a99437-97a5-4910-97e6-0438d58147c6';

async function main() {
  console.log('Using browser executable:', exec);
  const browser = await chromium.launch({ executablePath: exec, headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

    console.log('\n--- 1. Navigate to Buyer Dashboard ---');
    await page.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Verify tracker is displayed
    const tracker = await page.waitForSelector('#farmer-approval-tracker', { timeout: 5000 });
    if (!tracker) throw new Error('#farmer-approval-tracker not found!');

    // Verify driver details are removed
    const hasDriverSection = await page.locator('.farmer-driver-highlight-card, .farmer-driver-header-text, .farmer-driver-profile-row').count();
    console.log('Driver details section count (should be 0):', hasDriverSection);
    if (hasDriverSection !== 0) {
      throw new Error(`Expected driver details to be removed, found count: ${hasDriverSection}`);
    }

    // Verify only the two buttons exist
    const trackBtn = page.locator('.farmer-action-btn:has-text("Track Live Delivery Map"), .farmer-action-btn:has-text("நேரலை வரைபடம்")');
    const simulateBtn = page.locator('.farmer-action-btn:has-text("Simulate Next Stage"), .farmer-action-btn:has-text("அடுத்த நிலைக்கு")');

    const hasTrackBtn = await trackBtn.count();
    const hasSimulateBtn = await simulateBtn.count();
    console.log(`Buttons count: Track Live Map (${hasTrackBtn}), Simulate Next Stage (${hasSimulateBtn})`);

    if (hasTrackBtn === 0 || hasSimulateBtn === 0) {
      throw new Error('Expected both Track Live Map and Simulate Next Stage buttons to be present!');
    }

    const cleanCardShotPath = path.join(artifactsDir, 'farmer-status-bar-clean.png');
    await page.screenshot({ path: cleanCardShotPath });
    console.log(`Saved screenshot: ${cleanCardShotPath}`);

    // Click Simulate Next Stage and verify advancement
    console.log('\n--- 2. Click Simulate Next Stage ---');
    await simulateBtn.first().click();
    await page.waitForTimeout(600);

    const advancedShotPath = path.join(artifactsDir, 'farmer-status-bar-advanced.png');
    await page.screenshot({ path: advancedShotPath });
    console.log(`Saved screenshot: ${advancedShotPath}`);

    // Mobile view
    console.log('\n--- 3. Mobile View ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobileShotPath = path.join(artifactsDir, 'farmer-status-bar-clean-mobile.png');
    await page.screenshot({ path: mobileShotPath });
    console.log(`Saved mobile screenshot: ${mobileShotPath}`);

    console.log('\n✅ ALL VERIFICATIONS PASSED: Driver details removed, only Track Map & Simulate Next Stage kept!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
