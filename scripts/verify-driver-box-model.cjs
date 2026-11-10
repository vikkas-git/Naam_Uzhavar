const { chromium } = require('playwright-core');
const path = require('path');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('--- Verifying Driver Details Card Box Model ---');
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

  // Capture Driver Card
  const driverCard = await page.$('.buyer-driver-card');
  if (driverCard) {
    const cardPath = path.resolve(__dirname, 'driver-card-after.png');
    await driverCard.screenshot({ path: cardPath });
    console.log('Driver Card screenshot saved at:', cardPath);
  }

  // Capture full telemetry sidebar (Status card + Driver card + Farmer summary)
  const sidebar = await page.$('.buyer-telemetry-sidebar');
  if (sidebar) {
    const sidebarPath = path.resolve(__dirname, 'telemetry-sidebar-after.png');
    await sidebar.screenshot({ path: sidebarPath });
    console.log('Sidebar screenshot saved at:', sidebarPath);
  }

  // Inspect box model metrics
  const metrics = await page.evaluate(() => {
    const specsEl = document.querySelector('.buyer-driver-vehicle-specs');
    const rowEl = document.querySelector('.buyer-driver-vehicle-specs .buyer-spec-row');
    const pinEl = document.querySelector('.buyer-spec-row.pin-highlight');
    const computedSpecs = window.getComputedStyle(specsEl);
    const computedRow = window.getComputedStyle(rowEl);
    const computedPin = window.getComputedStyle(pinEl);

    return {
      specsPadding: computedSpecs.padding,
      specsBorder: computedSpecs.border,
      specsBorderRadius: computedSpecs.borderRadius,
      rowPadding: computedRow.padding,
      rowWidth: rowEl.getBoundingClientRect().width,
      pinPadding: computedPin.padding,
      pinWidth: pinEl.getBoundingClientRect().width,
      pinBackground: computedPin.backgroundColor
    };
  });

  console.log('Box model metrics:', JSON.stringify(metrics, null, 2));

  await browser.close();
})();
