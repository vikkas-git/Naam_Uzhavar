const { chromium } = require('playwright-core');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testSignOut() {
  console.log('--- Starting Buyer Sign Out Automated Verification ---');
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 1. Visit Login Page
  console.log('1. Navigating to /buyer-login...');
  await page.goto('http://localhost:5173/buyer-login', { waitUntil: 'networkidle' });
  console.log('   Current URL:', page.url());

  // 2. Perform Quick Demo Sign In
  console.log('2. Clicking Quick Demo Sign In...');
  const demoBtn = await page.waitForSelector('#buyer-quick-demo-btn');
  await demoBtn.click();

  // Wait for navigation specifically to /buyer-dashboard
  await page.waitForURL(url => url.pathname.includes('/buyer-dashboard'), { timeout: 10000 });
  console.log('3. Successfully logged in! Current URL:', page.url());

  const storedProfile = await page.evaluate(() => localStorage.getItem('buyer_current_profile'));
  console.log('   buyer_current_profile in localStorage:', storedProfile ? 'Present' : 'Missing');

  // 4. Test Sign Out from Header Profile Dropdown
  console.log('4. Opening profile dropdown in header...');
  const profilePill = await page.waitForSelector('.buyer-profile-chip-btn');
  await profilePill.click();
  await page.waitForTimeout(400);

  console.log('5. Clicking Sign Out in dropdown...');
  const headerSignOutBtn = await page.waitForSelector('#buyer-header-signout-btn');
  await headerSignOutBtn.click();
  await page.waitForTimeout(400);

  console.log('6. Confirming Sign Out modal...');
  const confirmBtn = await page.waitForSelector('#buyer-confirm-signout-btn');
  await confirmBtn.click();

  // Wait for redirect to buyer login
  await page.waitForURL(url => url.pathname === '/buyer-login', { timeout: 10000 });
  console.log('7. Successfully redirected to buyer-login! Current URL:', page.url());

  // 8. Verify storage state after signout
  const stateAfterSignOut = await page.evaluate(() => ({
    buyer_current_profile: localStorage.getItem('buyer_current_profile'),
    buyer_registered_profile: localStorage.getItem('buyer_registered_profile'),
    token: localStorage.getItem('naam_uzhavar_token'),
    explicit_signout: sessionStorage.getItem('buyer_explicit_signout')
  }));
  console.log('8. Storage verification after signout:', JSON.stringify(stateAfterSignOut, null, 2));

  if (stateAfterSignOut.buyer_current_profile !== null) {
    throw new Error('FAIL: buyer_current_profile was not removed from localStorage');
  }
  if (stateAfterSignOut.buyer_registered_profile !== null) {
    throw new Error('FAIL: buyer_registered_profile was not removed from localStorage');
  }
  if (stateAfterSignOut.explicit_signout !== 'true') {
    throw new Error('FAIL: buyer_explicit_signout was not set in sessionStorage');
  }
  console.log('   ✓ Storage correctly cleared and explicit_signout recorded!');

  // 9. Verify that visiting /buyer-dashboard directly redirects to /buyer-login
  console.log('9. Attempting to directly visit /buyer-dashboard while signed out...');
  await page.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  console.log('   URL after accessing /buyer-dashboard while signed out:', page.url());
  if (!page.url().includes('/buyer-login')) {
    throw new Error('FAIL: Direct access to /buyer-dashboard was not blocked after signout');
  }
  console.log('   ✓ Direct access to /buyer-dashboard properly redirects to /buyer-login!');

  // 10. Test Login with Credentials & Profile Page Sign Out
  console.log('10. Logging in with credentials (demo@naamuzhavar.com)...');
  await page.fill('#buyer-identifier', 'demo@naamuzhavar.com');
  await page.fill('#buyer-password', 'demo1234');
  await page.click('button[type="submit"]');

  await page.waitForURL(url => url.pathname.includes('/buyer-dashboard'), { timeout: 10000 });
  console.log('11. Logged in with credentials! Current URL:', page.url());

  console.log('12. Navigating to /buyer-dashboard/profile...');
  await page.goto('http://localhost:5173/buyer-dashboard/profile', { waitUntil: 'networkidle' });
  console.log('   Current URL:', page.url());

  console.log('13. Clicking Sign Out button on Profile page...');
  const profileSignOutBtn = await page.waitForSelector('#buyer-profile-signout-btn');
  await profileSignOutBtn.click();
  await page.waitForTimeout(400);

  console.log('14. Confirming Sign Out modal from Profile page...');
  const confirmBtn2 = await page.waitForSelector('#buyer-confirm-signout-btn');
  await confirmBtn2.click();

  await page.waitForURL(url => url.pathname === '/buyer-login', { timeout: 10000 });
  console.log('15. Successfully redirected to buyer-login! Current URL:', page.url());

  const stateAfterCredSignOut = await page.evaluate(() => ({
    buyer_current_profile: localStorage.getItem('buyer_current_profile'),
    buyer_registered_profile: localStorage.getItem('buyer_registered_profile'),
    explicit_signout: sessionStorage.getItem('buyer_explicit_signout')
  }));
  console.log('16. Storage verification after credential signout:', JSON.stringify(stateAfterCredSignOut, null, 2));

  if (stateAfterCredSignOut.buyer_current_profile !== null || stateAfterCredSignOut.buyer_registered_profile !== null) {
    throw new Error('FAIL: Buyer profile remained after signout');
  }
  console.log('   ✓ Profile page signout works flawlessly for credential login!');

  await browser.close();
  console.log('\n🎉 ALL BUYER SIGN OUT CHECKS PASSED SUCCESSFULLY! 🎉');
}

testSignOut().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
