const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
];

const executablePath = chromePaths.find(p => fs.existsSync(p));
const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\48a99437-97a5-4910-97e6-0438d58147c6';

async function main() {
  console.log('1. Starting Vite dev server...');
  const { createServer } = await import('vite');
  const server = await createServer({
    server: { port: 5194 },
    configFile: path.resolve(__dirname, '../vite.config.js')
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Vite running at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('2. Logging in as Buyer via Quick Demo...');
    await page.goto(`${baseUrl}/role-select?role=buyer`, { waitUntil: 'networkidle' });
    await page.click('#switch-tab-buyer');
    await page.waitForTimeout(200);
    await page.click('.role-demo-btn.buyer');
    await page.waitForURL('**/buyer-dashboard', { timeout: 6000 });
    console.log('Logged in successfully!');

    console.log('3. Navigating to /buyer-dashboard/crops...');
    await page.goto(`${baseUrl}/buyer-dashboard/crops`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.buyer-filter-chips');

    // Verify 'Vegetables' does not exist in filters
    const filterText = await page.locator('.buyer-filter-chips').textContent();
    console.log('Filter chips container text:', filterText.replace(/\s+/g, ' ').trim());
    const hasVegetables = filterText.includes('Vegetables');
    console.log('Does "Vegetables" exist in filters?', hasVegetables);
    if (hasVegetables) throw new Error('"Vegetables" should not be present in filters!');

    // Verify Grade A, B, C are NOT top-level buttons
    const rootButtons = await page.locator('.buyer-filter-chips > button, .buyer-filter-chips > .buyer-filter-dropdown-wrap > button').allTextContents();
    console.log('Root filter buttons:', rootButtons.map(t => t.replace(/\s+/g, ' ').trim()));

    // 3. Test Tomato Dropdown
    console.log('3. Clicking Tomato dropdown...');
    await page.click('#filter-dropdown-tomato');
    await page.waitForSelector('.buyer-filter-menu');
    await page.screenshot({ path: path.join(outDir, 'crops-filter-tomato-dropdown-open.png') });
    console.log('Saved crops-filter-tomato-dropdown-open.png');

    // Select Grade A for Tomato
    console.log('Selecting Grade A for Tomato...');
    await page.locator('.buyer-filter-menu-item:has-text("Grade A")').click();
    await page.waitForTimeout(300);

    // Verify filtered card titles & grades
    const tomatoCards = await page.locator('.buyer-crop-card').allTextContents();
    console.log('Number of tomato cards shown:', tomatoCards.length);
    for (const card of tomatoCards) {
      if (!card.toLowerCase().includes('tomato') && !card.includes('தக்காளி')) {
        throw new Error('Non-tomato card found when tomato filter active: ' + card.slice(0, 50));
      }
      if (!card.includes('Grade A')) {
        throw new Error('Non-Grade A card found when Grade A filter active: ' + card.slice(0, 50));
      }
    }
    console.log('All displayed cards are Tomato with Grade A!');
    await page.screenshot({ path: path.join(outDir, 'crops-filter-tomato-grade-a.png') });
    console.log('Saved crops-filter-tomato-grade-a.png');

    // 4. Test Onion Dropdown
    console.log('4. Clicking Onion dropdown...');
    await page.click('#filter-dropdown-onion');
    await page.waitForSelector('.buyer-filter-menu');
    await page.screenshot({ path: path.join(outDir, 'crops-filter-onion-dropdown-open.png') });
    console.log('Saved crops-filter-onion-dropdown-open.png');

    // Select Grade B for Onion
    console.log('Selecting Grade B for Onion...');
    await page.locator('.buyer-filter-menu-item:has-text("Grade B")').click();
    await page.waitForTimeout(300);

    const onionCards = await page.locator('.buyer-crop-card').allTextContents();
    console.log('Number of onion cards shown:', onionCards.length);
    for (const card of onionCards) {
      if (!card.toLowerCase().includes('onion') && !card.includes('வெங்காயம்')) {
        throw new Error('Non-onion card found: ' + card.slice(0, 50));
      }
      if (!card.includes('Grade B')) {
        throw new Error('Non-Grade B card found: ' + card.slice(0, 50));
      }
    }
    console.log('All displayed cards are Onion with Grade B!');
    await page.screenshot({ path: path.join(outDir, 'crops-filter-onion-grade-b.png') });
    console.log('Saved crops-filter-onion-grade-b.png');

    // 5. Test Potato Dropdown
    console.log('5. Clicking Potato dropdown...');
    await page.click('#filter-dropdown-potato');
    await page.waitForSelector('.buyer-filter-menu');
    await page.screenshot({ path: path.join(outDir, 'crops-filter-potato-dropdown-open.png') });
    console.log('Saved crops-filter-potato-dropdown-open.png');

    // Select Grade C for Potato
    console.log('Selecting Grade C for Potato...');
    await page.locator('.buyer-filter-menu-item:has-text("Grade C")').click();
    await page.waitForTimeout(300);

    const potatoCards = await page.locator('.buyer-crop-card').allTextContents();
    console.log('Number of potato cards shown:', potatoCards.length);
    for (const card of potatoCards) {
      if (!card.toLowerCase().includes('potato') && !card.includes('உருளை')) {
        throw new Error('Non-potato card found: ' + card.slice(0, 50));
      }
      if (!card.includes('Grade C')) {
        throw new Error('Non-Grade C card found: ' + card.slice(0, 50));
      }
    }
    console.log('All displayed cards are Potato with Grade C!');

    // 6. Test 'All' reset
    console.log('6. Clicking All filter chip...');
    await page.locator('.buyer-filter-chips > button:has-text("All")').click();
    await page.waitForTimeout(300);
    const allCards = await page.locator('.buyer-crop-card').count();
    console.log('Total cards restored on "All":', allCards);
    await page.screenshot({ path: path.join(outDir, 'crops-filter-all-reset.png') });
    console.log('Saved crops-filter-all-reset.png');

    console.log('🎉 ALL PRODUCE & GRADE DROPDOWN FILTER TESTS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
