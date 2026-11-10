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

async function testSimpleInvoice() {
  console.log('>>> Starting Simplified Invoice Verification <<<');
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  console.log('\n--- 1. Set Auth & Open Invoices Page ---');
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

  await page.goto('http://localhost:5173/buyer-dashboard/invoices', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  console.log('\n--- 2. Verify Simple Stats Bar ---');
  const statsBar = await page.$('.simple-invoices-stats-bar');
  if (!statsBar) throw new Error('Simple stats bar not found');
  const statsBoxes = await page.$$('.simple-stat-box');
  console.log('Stats boxes count (should be 3):', statsBoxes.length);

  const shotList = path.join(outDir, 'simple_invoices_page.png');
  await page.screenshot({ path: shotList });
  console.log('Saved simple invoice list screenshot:', shotList);

  console.log('\n--- 3. Click View Invoice to Open Simple Sheet ---');
  const viewBtn = await page.$('.simple-btn-view');
  if (!viewBtn) throw new Error('View Invoice button not found');
  await viewBtn.click();
  await page.waitForTimeout(600);

  const sheet = await page.$('.simple-invoice-sheet');
  if (!sheet) throw new Error('Simple invoice sheet not found');

  const sheetText = await sheet.innerText();
  console.log('\n--- Simple Sheet Content Sample ---\n', sheetText);

  // Assert essential details exist
  if (!sheetText.includes('Naam Uzhavar')) throw new Error('Missing brand title');
  if (!sheetText.includes('INV-2026-')) throw new Error('Missing invoice number');
  if (!sheetText.toUpperCase().includes('ORDER ID')) throw new Error('Missing order ID');
  if (!sheetText.toUpperCase().includes('BILLED TO')) throw new Error('Missing Billed To');
  if (!sheetText.toUpperCase().includes('FARMER & HUB')) throw new Error('Missing Farmer & Hub');
  if (!sheetText.includes('Total Amount')) throw new Error('Missing Total Amount');

  // Assert unwanted details have been REMOVED
  if (sheetText.includes('CIN:')) throw new Error('Unwanted CIN still present!');
  if (sheetText.includes('FSSAI:')) throw new Error('Unwanted FSSAI still present!');
  if (sheetText.includes('HSN / SAC') || sheetText.includes('0702.00.00')) throw new Error('Unwanted HSN code still present!');
  if (sheetText.includes('E-Way Bill:')) throw new Error('Unwanted E-Way Bill still present!');
  if (sheetText.includes('Central GST') || sheetText.includes('CGST')) throw new Error('Unwanted CGST still present!');
  if (sheetText.includes('State GST') || sheetText.includes('SGST')) throw new Error('Unwanted SGST still present!');
  if (sheetText.includes('Bank: State Bank of India') || sheetText.includes('IFSC:')) throw new Error('Unwanted bank account block still present!');
  if (sheetText.includes('Invoice Hash:')) throw new Error('Unwanted cryptographic hash still present!');

  console.log('\n>>> All unwanted details successfully removed! Only important details kept! <<<');

  const shotSheet = path.join(outDir, 'simple_invoice_sheet_preview.png');
  await page.screenshot({ path: shotSheet });
  console.log('Saved simple invoice sheet screenshot:', shotSheet);

  await browser.close();
}

testSimpleInvoice().catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
