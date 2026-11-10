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

async function testInvoices() {
  console.log('>>> Starting Invoices Page Verification <<<');
  const browser = await chromium.launch({ executablePath: exec, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('\n--- 1. Set Auth & Open Invoices Page Directly ---');
  await page.goto('http://localhost:5173/buyer-login');
  await page.evaluate(() => {
    localStorage.setItem('buyer_current_profile', JSON.stringify({
      id: 'demo-buyer-1',
      fullName: 'Grand Palace Hotel',
      businessName: 'Grand Palace Luxury Hotel',
      buyerType: 'hotel',
      phone: '9840123456',
      city: 'Madurai',
      gstin: '33AABCG1234F1Z9',
      address: 'Nagari Bypass Road, Madurai 625016'
    }));
  });

  await page.goto('http://localhost:5173/buyer-dashboard/invoices', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  console.log('\n--- 2. Verify Page Header & Metrics ---');
  const title = await page.$eval('.buyer-view-title', el => el.innerText.trim());
  console.log('Page Title:', title);
  if (!title.includes('Direct Farm Invoices') && !title.includes('விலைப்பட்டியல்கள்')) {
    throw new Error(`Unexpected page title: ${title}`);
  }

  const statCards = await page.$$('.buyer-invoice-stat-card');
  console.log('Found stat cards:', statCards.length);
  if (statCards.length !== 4) {
    throw new Error(`Expected 4 stat cards, found ${statCards.length}`);
  }

  console.log('\n--- 3. Verify Invoices List ---');
  const invoiceCards = await page.$$('.buyer-invoice-card');
  console.log('Found invoice cards:', invoiceCards.length);
  if (invoiceCards.length === 0) {
    throw new Error('No invoice cards found');
  }

  const firstInvNum = await page.$eval('.buyer-invoice-num', el => el.innerText.trim());
  console.log('First Invoice Number:', firstInvNum);

  const shotList = path.join(outDir, 'invoices_page_list.png');
  await page.screenshot({ path: shotList });
  console.log('Saved screenshot of invoice list to:', shotList);

  console.log('\n--- 4. Click View Tax Invoice on First Invoice ---');
  const viewBtn = await page.$('.buyer-invoice-view-btn');
  await viewBtn.click();
  await page.waitForTimeout(600);

  const modal = await page.$('.buyer-invoice-modal-content');
  if (!modal) throw new Error('Tax invoice modal did not open!');

  const modalTitle = await page.$eval('.buyer-invoice-modal-title', el => el.innerText.trim());
  console.log('Modal Title:', modalTitle);

  const fpoName = await page.$eval('.invoice-fpo-titles h2', el => el.innerText.trim());
  console.log('FPO Heading in Invoice:', fpoName);

  const wordsVal = await page.$eval('.words-val', el => el.innerText.trim());
  console.log('Amount in Words:', wordsVal);

  const shotModal = path.join(outDir, 'tax_invoice_modal_preview.png');
  await page.screenshot({ path: shotModal });
  console.log('Saved screenshot of tax invoice modal to:', shotModal);

  console.log('\n--- 5. Close Modal ---');
  const closeBtn = await page.$('.buyer-invoice-modal-close-btn');
  await closeBtn.click();
  await page.waitForTimeout(400);

  const modalAfterClose = await page.$('.buyer-invoice-modal-content');
  console.log('Modal visible after close:', !!modalAfterClose);

  console.log('\n--- 6. Test Navigation from Orders Page to Invoice ---');
  await page.goto('http://localhost:5173/buyer-dashboard/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const viewInvoiceBtn = await page.$('button:has-text("Invoice"), button:has-text("View Invoice")');
  if (!viewInvoiceBtn) throw new Error('Invoice button on orders page not found!');
  await viewInvoiceBtn.click();
  await page.waitForTimeout(800);

  console.log('Current URL after clicking Invoice from Orders:', page.url());
  if (!page.url().includes('/buyer-dashboard/invoices')) {
    throw new Error('Did not navigate to /buyer-dashboard/invoices');
  }

  const modalFromOrder = await page.$('.buyer-invoice-modal-content');
  console.log('Tax invoice modal opened automatically via order query param:', !!modalFromOrder);

  const shotFromOrder = path.join(outDir, 'invoice_opened_from_order.png');
  await page.screenshot({ path: shotFromOrder });
  console.log('Saved screenshot from order navigation:', shotFromOrder);

  await browser.close();
  console.log('\n>>> All Invoices Page assertions PASSED successfully! <<<');
}

testInvoices().catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
