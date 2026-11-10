const { chromium } = require('playwright-core');
const path = require('path');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('--- Verifying Category Removal from Buyer Module ---');
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

  await page.goto('http://localhost:5173/buyer-dashboard/crops', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Get all filter chip labels
  const chipLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.buyer-filter-chips button.buyer-chip'))
      .map(b => b.textContent.trim());
  });

  console.log('Current filter chips present:', chipLabels);

  // Check that combo categories are removed
  const hasGradeAB = chipLabels.some(l => l.includes('Grade A & Grade B') || l.includes('Grade A & B'));
  const hasGradeAC = chipLabels.some(l => l.includes('Grade A & Grade C') || l.includes('Grade A & C'));
  const hasGradeBC = chipLabels.some(l => l.includes('Grade B & Grade C') || l.includes('Grade B & C'));

  console.log('Check removed chips:');
  console.log('  Has "Grade A & Grade B":', hasGradeAB);
  console.log('  Has "Grade A & Grade C":', hasGradeAC);
  console.log('  Has "Grade B & Grade C":', hasGradeBC);

  if (hasGradeAB || hasGradeAC || hasGradeBC) {
    throw new Error('Combo categories were NOT removed from the filter bar!');
  }

  // Check expected chips exist
  console.log('Check remaining chips:');
  ['All', 'Vegetables', 'Grade A', 'Grade B', 'Grade C'].forEach(expected => {
    const found = chipLabels.includes(expected);
    console.log(`  Has "${expected}":`, found);
    if (!found) throw new Error(`Expected chip "${expected}" is missing!`);
  });

  // 2. Test Grade A
  await page.locator('button.buyer-chip:has-text("Grade A")').first().click();
  await page.waitForTimeout(400);
  const gradeACount = await page.evaluate(() => document.querySelectorAll('.buyer-crop-card').length);
  console.log(`Grade A count: ${gradeACount}`);

  // 3. Test Grade B
  await page.locator('button.buyer-chip:has-text("Grade B")').first().click();
  await page.waitForTimeout(400);
  const gradeBCount = await page.evaluate(() => document.querySelectorAll('.buyer-crop-card').length);
  console.log(`Grade B count: ${gradeBCount}`);

  // 4. Test Grade C
  await page.locator('button.buyer-chip:has-text("Grade C")').first().click();
  await page.waitForTimeout(400);
  const gradeCCount = await page.evaluate(() => document.querySelectorAll('.buyer-crop-card').length);
  console.log(`Grade C count: ${gradeCCount}`);

  // 5. Reset to All
  await page.locator('button.buyer-chip:has-text("All")').first().click();
  await page.waitForTimeout(400);

  // 6. Screenshot
  const shotPath = path.resolve(__dirname, 'crops-category-removed.png');
  await page.screenshot({ path: shotPath });
  console.log('Screenshot saved to:', shotPath);

  console.log('✓ ALL VALIDATIONS PASSED!');
  await browser.close();
})();
