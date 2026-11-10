const { chromium } = require('playwright-core');
const path = require('path');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto('http://localhost:5173/buyer-login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    sessionStorage.removeItem('buyer_explicit_signout');
    const profile = {
      id: '6ae0acf2e8fd8eb6a40be371',
      _id: '6ae0acf2e8fd8eb6a40be371',
      businessName: 'Murugam hotel',
      shopName: 'Murugam hotel',
      contactPerson: 'Vimal Kumar',
      name: 'Vimal Kumar',
      phone: '+91 6374122898',
      role: 'buyer'
    };
    localStorage.setItem('buyer_current_profile', JSON.stringify(profile));
    localStorage.setItem('buyer_registered_profile', JSON.stringify(profile));
  });
  await page.goto('http://localhost:5173/buyer-dashboard/track', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const card = await page.$('.buyer-driver-card');
  if (card) {
    const outputPath = path.resolve(__dirname, 'driver-card-before.png');
    await card.screenshot({ path: outputPath });
    console.log('Driver card captured at:', outputPath);
  } else {
    console.log('Driver card not found, capturing entire page...');
    await page.screenshot({ path: path.resolve(__dirname, 'page-track.png') });
  }
  await browser.close();
})();
