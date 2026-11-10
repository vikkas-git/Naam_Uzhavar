const { chromium } = require('playwright-core');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function verifyNameDisplay() {
  console.log('--- Verifying Buyer Profile Name & Establishment Display ---');
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Seed localStorage with Murugam hotel user to emulate exact state from user's screenshot
  await page.goto('http://localhost:5173/buyer-login', { waitUntil: 'networkidle' });

  console.log('1. Setting Murugam hotel buyer in localStorage...');
  await page.evaluate(() => {
    sessionStorage.removeItem('buyer_explicit_signout');
    const profile = {
      id: '6ae0acf2e8fd8eb6a40be371',
      _id: '6ae0acf2e8fd8eb6a40be371',
      businessName: 'Murugam hotel',
      shopName: 'Murugam hotel',
      contactPerson: 'Vimal Kumar',
      name: 'Vimal Kumar',
      fullName: 'Vimal Kumar',
      email: 'vimalku2516@gmail.com',
      phone: '+91 6374122898',
      gstin: '27CCCCC2222C1Z8',
      address: 'murugabavanam ,dindigul,624001',
      buyerType: 'hotel',
      role: 'buyer'
    };
    localStorage.setItem('buyer_current_profile', JSON.stringify(profile));
    localStorage.setItem('buyer_registered_profile', JSON.stringify(profile));
  });

  // Navigate to dashboard
  console.log('2. Navigating to /buyer-dashboard...');
  await page.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });

  // Wait for topbar profile chip
  await page.waitForSelector('.buyer-profile-chip-btn');

  // Verify Topbar Pill text
  const topbarName = await page.textContent('.buyer-profile-full-name');
  const topbarSub = await page.textContent('.buyer-role-subtext');
  console.log('3. Topbar Header Pill:');
  console.log('   Full Name (Person):', topbarName.trim());
  console.log('   Establishment (Shop):', topbarSub.trim());

  if (topbarName.trim() !== 'Vimal Kumar') {
    throw new Error(`Expected topbar name to be "Vimal Kumar", got: "${topbarName.trim()}"`);
  }
  if (topbarSub.trim() !== 'Murugam hotel') {
    throw new Error(`Expected topbar establishment to be "Murugam hotel", got: "${topbarSub.trim()}"`);
  }

  // Open Dropdown
  console.log('4. Clicking profile chip to open dropdown...');
  await page.click('.buyer-profile-chip-btn');
  await page.waitForSelector('.buyer-profile-dropdown');

  // Verify Dropdown Card Contents
  const cardTitle = await page.textContent('.buyer-card-title');
  const subItems = await page.$$eval('.buyer-card-sub', elements => elements.map(el => el.textContent.trim()));

  console.log('5. Dropdown Card Information:');
  console.log('   Card Title (Firm):', cardTitle.trim());
  subItems.forEach((item, idx) => console.log(`   Line ${idx + 1}:`, item));

  // Verify cardTitle is Firm Name ("Murugam hotel")
  if (cardTitle.trim() !== 'Murugam hotel') {
    throw new Error(`Expected card title to be "Murugam hotel", got: "${cardTitle.trim()}"`);
  }

  // Verify Person line has "Vimal Kumar"
  const personLine = subItems.find(s => s.includes('👤'));
  console.log('   Contact Person line:', personLine);
  if (!personLine || !personLine.includes('Vimal Kumar')) {
    throw new Error(`Expected 👤 line to contain "Vimal Kumar", got: "${personLine}"`);
  }

  // Verify Category line has Hotel
  const categoryLine = subItems.find(s => s.includes('🏢'));
  console.log('   Establishment Type line:', categoryLine);
  if (!categoryLine || categoryLine.includes('Murugam hotel')) {
    throw new Error(`Expected 🏢 line to be category and not repeat "Murugam hotel", got: "${categoryLine}"`);
  }

  // Take screenshot of the fixed dropdown
  await page.screenshot({ path: 'scripts/fixed-buyer-name-dropdown.png' });
  console.log('6. Screenshot saved to scripts/fixed-buyer-name-dropdown.png');

  await browser.close();
  console.log('\n🎉 ALL BUYER NAME & ESTABLISHMENT DISPLAY CHECKS PASSED! 🎉');
}

verifyNameDisplay().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
