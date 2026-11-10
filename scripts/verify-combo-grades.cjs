const { chromium } = require('playwright-core');
const path = require('path');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('--- Testing Grade A & B, Grade A & C, and Grade B & C Combination Filtering ---');
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

  // Helper to test a filter
  async function testFilter(label, screenshotName) {
    console.log(`\nTesting filter: "${label}"...`);
    const btn = page.locator(`button.buyer-chip:has-text("${label}")`).first();
    await btn.click();
    await page.waitForTimeout(600);

    const crops = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.buyer-crop-card')).map(card => {
        const name = card.querySelector('.buyer-crop-name')?.textContent?.trim();
        const grade = card.querySelector('.buyer-crop-grade-tag')?.textContent?.trim();
        const imgSrc = card.querySelector('.buyer-crop-img')?.src;
        return { name, grade, imgSrc };
      });
    });

    console.log(`Found ${crops.length} items for "${label}":`);
    crops.slice(0, 6).forEach((c, i) => console.log(`  ${i + 1}. ${c.name} [${c.grade}]`));

    const shotPath = path.resolve(__dirname, screenshotName);
    await page.screenshot({ path: shotPath });
    console.log(`Screenshot saved: ${screenshotName}`);
    return crops;
  }

  // 1. Grade A & Grade B
  const cropsAB = await testFilter('Grade A & Grade B', 'combo-grade-ab.png');
  const hasComboAB = cropsAB.some(c => c.grade === 'Grade A & Grade B');
  const hasA_in_AB = cropsAB.some(c => c.grade === 'Grade A');
  console.log(`  Has "Grade A & Grade B" combo items: ${hasComboAB}`);
  console.log(`  Has "Grade A" items: ${hasA_in_AB}`);
  if (!hasComboAB || !hasA_in_AB) throw new Error('Grade A & Grade B test failed');

  // 2. Grade A & Grade C
  const cropsAC = await testFilter('Grade A & Grade C', 'combo-grade-ac.png');
  const hasComboAC = cropsAC.some(c => c.grade === 'Grade A & Grade C');
  const hasA_in_AC = cropsAC.some(c => c.grade === 'Grade A');
  const hasC_in_AC = cropsAC.some(c => c.grade === 'Grade C');
  console.log(`  Has "Grade A & Grade C" combo items: ${hasComboAC}`);
  console.log(`  Has "Grade A" items: ${hasA_in_AC}`);
  console.log(`  Has "Grade C" items: ${hasC_in_AC}`);
  if (!hasComboAC || !hasA_in_AC || !hasC_in_AC) throw new Error('Grade A & Grade C test failed');

  // 3. Grade B & Grade C
  const cropsBC = await testFilter('Grade B & Grade C', 'combo-grade-bc.png');
  const hasComboBC = cropsBC.some(c => c.grade === 'Grade B & Grade C');
  const hasC_in_BC = cropsBC.some(c => c.grade === 'Grade C');
  console.log(`  Has "Grade B & Grade C" combo items: ${hasComboBC}`);
  console.log(`  Has "Grade C" items: ${hasC_in_BC}`);
  if (!hasComboBC || !hasC_in_BC) throw new Error('Grade B & Grade C test failed');

  console.log('\n✓ ALL TESTS PASSED SUCCESSFULLY!');
  await browser.close();
})();
