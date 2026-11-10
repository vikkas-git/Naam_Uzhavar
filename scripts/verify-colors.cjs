const fs = require('fs');
const { chromium } = require('playwright-core');

const chromePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
];

const executablePath = chromePaths.find(p => fs.existsSync(p));
const BASE_URL = 'http://localhost:5173';

function normalizeColor(c) {
  return c ? c.replace(/\s+/g, '').toLowerCase() : '';
}

async function run() {
  console.log('Launching browser for Color Audit...');
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log('\n--- 1. AUDITING GREEN COLOR UNIFORMITY (HOME & FARMER) ---');
    // A. Check Home Page primary button
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hp-btn-primary');
    const homeBtnBg = await page.$eval('.hp-btn-primary', el => window.getComputedStyle(el).backgroundColor);
    console.log(`Home Page Primary Button Bg: ${homeBtnBg}`);

    // B. Check Role Selection Farmer Card button
    await page.goto(BASE_URL + '/role-select', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.farmer-theme .role-card-action-btn');
    const farmerCardBtnBg = await page.$eval('.farmer-theme .role-card-action-btn', el => window.getComputedStyle(el).backgroundColor);
    console.log(`Role Select Farmer Card Button Bg: ${farmerCardBtnBg}`);

    // C. Check Farmer Modal submit button
    await page.click('.farmer-theme .role-card-action-btn');
    await page.waitForSelector('.modal-dialog form button[type="submit"]', { timeout: 3000 });
    const farmerModalBtnBg = await page.$eval('.modal-dialog form button[type="submit"]', el => window.getComputedStyle(el).backgroundColor);
    console.log(`Farmer Modal Submit Button Bg: ${farmerModalBtnBg}`);

    const expectedGreen = 'rgb(21,128,61)'; // #15803d
    console.log(`Expected Green (#15803d): ${expectedGreen}`);

    if (normalizeColor(homeBtnBg) !== expectedGreen) {
      throw new Error(`Home button bg ${homeBtnBg} does not match expected ${expectedGreen}`);
    }
    if (normalizeColor(farmerCardBtnBg) !== expectedGreen) {
      throw new Error(`Farmer card button bg ${farmerCardBtnBg} does not match expected ${expectedGreen}`);
    }
    if (normalizeColor(farmerModalBtnBg) !== expectedGreen) {
      throw new Error(`Farmer modal button bg ${farmerModalBtnBg} does not match expected ${expectedGreen}`);
    }
    console.log('✓ All 3 Green elements match #15803d perfectly!');

    console.log('\n--- 2. AUDITING BUYER COLOR (EYE-CATCHY DEEP OCEAN BLUE) ---');
    // A. Check Buyer Card on Role Select
    await page.goto(BASE_URL + '/role-select', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.buyer-theme .role-card-action-btn');
    const buyerCardBtnBg = await page.$eval('.buyer-theme .role-card-action-btn', el => window.getComputedStyle(el).backgroundColor);
    const buyerCardBorderTop = await page.$eval('.role-select-card.buyer-theme', el => window.getComputedStyle(el).borderTopColor);
    console.log(`Role Select Buyer Card Button Bg: ${buyerCardBtnBg}`);
    console.log(`Role Select Buyer Card Top Border: ${buyerCardBorderTop}`);

    // B. Check Buyer Login Page submit button
    await page.goto(BASE_URL + '/buyer-login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.buyer-login-form button[type="submit"]');
    const buyerLoginBtnBg = await page.$eval('.buyer-login-form button[type="submit"]', el => window.getComputedStyle(el).backgroundColor);
    const buyerIconBoxBg = await page.$eval('.buyer-icon-box', el => window.getComputedStyle(el).backgroundColor);
    console.log(`Buyer Login Primary Button Bg: ${buyerLoginBtnBg}`);
    console.log(`Buyer Login Icon Box Bg: ${buyerIconBoxBg}`);

    // C. Check Buyer Dashboard active nav item & transit spotlight
    await page.evaluate(() => {
      localStorage.setItem('buyer_current_profile', JSON.stringify({
        name: 'Grand Palace Hotel',
        shopName: 'Grand Palace Luxury Dining',
        role: 'buyer'
      }));
    });
    await page.goto(BASE_URL + '/buyer-dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.buyer-top-nav-item.active');
    const activeNavBg = await page.$eval('.buyer-top-nav-item.active', el => window.getComputedStyle(el).backgroundColor);
    console.log(`Buyer Dashboard Active Nav Tab Bg: ${activeNavBg}`);

    const expectedOceanBlue = 'rgb(3,105,161)'; // #0369a1 (Sky-700 / Deep Ocean Blue)
    console.log(`Expected Deep Ocean Blue (#0369a1): ${expectedOceanBlue}`);

    if (normalizeColor(buyerCardBtnBg) !== expectedOceanBlue) {
      throw new Error(`Buyer card button bg ${buyerCardBtnBg} does not match expected ${expectedOceanBlue}`);
    }
    if (normalizeColor(buyerCardBorderTop) !== expectedOceanBlue) {
      throw new Error(`Buyer card border top ${buyerCardBorderTop} does not match expected ${expectedOceanBlue}`);
    }
    if (normalizeColor(buyerLoginBtnBg) !== expectedOceanBlue) {
      throw new Error(`Buyer login button bg ${buyerLoginBtnBg} does not match expected ${expectedOceanBlue}`);
    }
    if (normalizeColor(activeNavBg) !== expectedOceanBlue) {
      throw new Error(`Buyer dashboard active nav bg ${activeNavBg} does not match expected ${expectedOceanBlue}`);
    }
    console.log('✓ All Buyer elements (Card, Login, Dashboard) match #0369a1 ocean blue perfectly!');

    console.log('\n--- 3. AUDITING INVOICES TAB & RUPEES TOTAL COLOR ---');
    const invoiceBtn = await page.$('button.buyer-top-nav-item:has-text("Invoices"), button.buyer-top-nav-item:has-text("விலைப்பட்டியல்கள்")');
    if (invoiceBtn) {
      await invoiceBtn.click();
    } else {
      await page.goto(BASE_URL + '/buyer-dashboard/invoices', { waitUntil: 'domcontentloaded' });
    }
    await page.waitForSelector('.simple-inv-tab.active', { timeout: 5000 });
    const invoiceTabBg = await page.$eval('.simple-inv-tab.active', el => window.getComputedStyle(el).backgroundColor);
    console.log(`Invoice Active Tab Bg: ${invoiceTabBg}`);
    if (normalizeColor(invoiceTabBg) !== expectedOceanBlue) {
      throw new Error(`Invoice active tab bg ${invoiceTabBg} does not match expected ${expectedOceanBlue}`);
    }

    await page.waitForSelector('.simple-total-amount', { timeout: 5000 });
    const invoiceTotalColor = await page.$eval('.simple-total-amount', el => window.getComputedStyle(el).color);
    console.log(`Invoice Total Amount (₹) Color: ${invoiceTotalColor}`);
    const expectedBlack = 'rgb(15,23,42)'; // #0f172a (Deep solid black)
    console.log(`Expected Black (#0f172a): ${expectedBlack}`);
    if (normalizeColor(invoiceTotalColor) !== expectedBlack) {
      throw new Error(`Invoice total amount color ${invoiceTotalColor} is not black (${expectedBlack})`);
    }
    console.log('✓ Invoice active tab is #0369a1 and total rupee amount is solid black (#0f172a)!');

    console.log('\n--- 4. AUDITING PRODUCE CARD RUPEES & PRICE COLOR (SOLID BLACK #0f172a) ---');
    // Check produce card price on dashboard overview
    await page.goto(BASE_URL + '/buyer-dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.buyer-price-currency', { timeout: 5000 });
    const rupeeCurrencyColor = await page.$eval('.buyer-price-currency', el => window.getComputedStyle(el).color);
    const rupeeNumberColor = await page.$eval('.buyer-price-number', el => window.getComputedStyle(el).color);
    console.log(`Rupee symbol (₹) Color: ${rupeeCurrencyColor}`);
    console.log(`Rupee price number Color: ${rupeeNumberColor}`);

    if (normalizeColor(rupeeCurrencyColor) !== expectedBlack) {
      throw new Error(`Rupee symbol color ${rupeeCurrencyColor} is not black (${expectedBlack})`);
    }
    if (normalizeColor(rupeeNumberColor) !== expectedBlack) {
      throw new Error(`Rupee price number color ${rupeeNumberColor} is not black (${expectedBlack})`);
    }
    console.log('✓ All produce rupee symbols (₹) and price numbers are solid black (#0f172a)!');

    // Capture screenshots for visual confirmation
    const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\84e16d3e-4fe1-4ba3-84bb-c27b6491b831';
    await page.goto(BASE_URL + '/role-select', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: `${artifactDir}\\role_select_darker_blue.png` });

    // Clear auth to view Buyer Login form properly
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/buyer-login', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: `${artifactDir}\\buyer_login_darker_blue.png` });

    // Set auth to view Buyer Dashboard
    await page.evaluate(() => {
      localStorage.setItem('buyer_current_profile', JSON.stringify({
        name: 'Grand Palace Hotel',
        shopName: 'Grand Palace Luxury Dining',
        role: 'buyer'
      }));
    });
    await page.goto(BASE_URL + '/buyer-dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${artifactDir}\\buyer_dashboard_darker_blue.png` });

    // Invoices Page
    const invBtn = await page.$('button.buyer-top-nav-item:has-text("Invoices"), button.buyer-top-nav-item:has-text("விலைப்பட்டியல்கள்")');
    if (invBtn) await invBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${artifactDir}\\buyer_invoices_black_rupees.png` });

    // Crops Page
    const cropBtn = await page.$('button.buyer-top-nav-item:has-text("Available Crops"), button.buyer-top-nav-item:has-text("கிடைக்கும் பயிர்கள்")');
    if (cropBtn) await cropBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${artifactDir}\\buyer_crops_black_rupees.png` });

    console.log('✓ Visual screenshots saved to artifact directory!');

    console.log('\n======================================================');
    console.log('🎉 COLOR AUDIT COMPLETE: 100% UNIFORMITY & DARK BLUE VERIFIED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ COLOR AUDIT FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
