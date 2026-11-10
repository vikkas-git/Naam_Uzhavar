const { chromium } = require('playwright-core');
const path = require('path');
const exec = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('--- Verifying Produce Catalog Grade A & Grade C Filtering ---');
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 960 });

  // 1. Setup buyer session
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

  // 2. Navigate to /buyer-dashboard/crops
  await page.goto('http://localhost:5173/buyer-dashboard/crops', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 3. Click 'Grade A & Grade C' filter chip
  console.log('Clicking "Grade A & Grade C" filter button...');
  const gradeACPill = page.locator('button.buyer-chip:has-text("Grade A & Grade C")');
  await gradeACPill.click();
  await page.waitForTimeout(600);

  // 4. Inspect visible crop cards and their grades
  const cropData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.buyer-crop-card'));
    return cards.map(c => {
      const name = c.querySelector('.buyer-crop-name')?.textContent?.trim();
      const grade = c.querySelector('.buyer-crop-grade-tag')?.textContent?.trim();
      return { name, grade };
    });
  });

  console.log(`Found ${cropData.length} crops under "Grade A & Grade C":`);
  cropData.forEach((c, idx) => console.log(`  ${idx + 1}. ${c.name} [${c.grade}]`));

  // Verify that Grade A and Grade C are both present
  const hasGradeA = cropData.some(c => c.grade === 'Grade A');
  const hasGradeC = cropData.some(c => c.grade === 'Grade C');
  const hasGradeB = cropData.some(c => c.grade === 'Grade B');

  console.log(`Validation results:`);
  console.log(`  Contains Grade A: ${hasGradeA}`);
  console.log(`  Contains Grade C: ${hasGradeC}`);
  console.log(`  Contains Grade B (should be false): ${hasGradeB}`);

  if (!hasGradeA || !hasGradeC || hasGradeB) {
    throw new Error('Grade A & Grade C filtering test failed!');
  }

  // 5. Screenshot Grade A & Grade C
  const acScreenshotPath = path.resolve(__dirname, 'crops-filter-ac-after.png');
  await page.screenshot({ path: acScreenshotPath });
  console.log('Screenshot of Grade A & Grade C saved to:', acScreenshotPath);

  // 6. Test Grade C alone
  console.log('Clicking "Grade C" filter button...');
  const gradeCPill = page.locator('button.buyer-chip:has-text("Grade C")').first();
  await gradeCPill.click();
  await page.waitForTimeout(600);

  const gradeCData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.buyer-crop-card'));
    return cards.map(c => {
      const name = c.querySelector('.buyer-crop-name')?.textContent?.trim();
      const grade = c.querySelector('.buyer-crop-grade-tag')?.textContent?.trim();
      return { name, grade };
    });
  });

  console.log(`Found ${gradeCData.length} crops under "Grade C":`);
  gradeCData.forEach((c, idx) => console.log(`  ${idx + 1}. ${c.name} [${c.grade}]`));

  const allGradeC = gradeCData.every(c => c.grade === 'Grade C');
  if (!allGradeC || gradeCData.length < 5) {
    throw new Error(`Grade C filtering validation failed! Expected >= 5 items all Grade C, got ${gradeCData.length}`);
  }

  const cScreenshotPath = path.resolve(__dirname, 'crops-filter-c-after.png');
  await page.screenshot({ path: cScreenshotPath });
  console.log('Screenshot of Grade C alone saved to:', cScreenshotPath);

  console.log('✓ All filter checks passed successfully!');
  await browser.close();
})();
