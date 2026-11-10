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
const outDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\1b25d999-b2af-43d5-9c13-5700e3ade86c';

async function run() {
  const browser = await chromium.launch({
    executablePath,
    headless: true
  });

  // 1. Capture Buyer Registration (Desktop & Mobile)
  console.log('Capturing Buyer Registration...');
  const regContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const regPage = await regContext.newPage();
  // Clear any existing session to stay on guest route
  await regPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await regPage.evaluate(() => localStorage.removeItem('buyer_current_profile'));
  await regPage.goto('http://localhost:5173/buyer-register', { waitUntil: 'networkidle' });
  await regPage.screenshot({ path: path.join(outDir, 'buyer_register_desktop.png'), fullPage: true });
  console.log('Saved buyer_register_desktop.png');

  // Mobile registration
  const regMobContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const regMobPage = await regMobContext.newPage();
  await regMobPage.goto('http://localhost:5173/buyer-register', { waitUntil: 'networkidle' });
  await regMobPage.screenshot({ path: path.join(outDir, 'buyer_register_mobile.png'), fullPage: true });
  console.log('Saved buyer_register_mobile.png');

  // 2. Set up authenticated profile in localStorage for Buyer Dashboard
  const mockProfile = {
    name: 'Grand Palace Hotel',
    shopName: 'Grand Palace Luxury Dining',
    businessName: 'Grand Palace Luxury Dining',
    contactPerson: 'Mr. S. Rajesh (Procurement Head)',
    phone: '+91 98401 23456',
    email: 'procurement@grandpalace.in',
    buyerType: 'hotel',
    businessType: 'Hotel & Commercial Kitchen',
    address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
    gstin: '33AAAAA0000A1Z5',
    verified: true
  };

  // Capture Dashboard Overview (Desktop)
  console.log('Capturing Buyer Dashboard...');
  const dashContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dashPage = await dashContext.newPage();
  await dashPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await dashPage.evaluate((p) => {
    localStorage.setItem('buyer_current_profile', JSON.stringify(p));
  }, mockProfile);

  await dashPage.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
  await dashPage.waitForTimeout(600);
  await dashPage.screenshot({ path: path.join(outDir, 'buyer_dashboard_desktop.png'), fullPage: true });
  console.log('Saved buyer_dashboard_desktop.png');

  // Capture Dashboard Overview (Tablet)
  const dashTabContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const dashTabPage = await dashTabContext.newPage();
  await dashTabPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await dashTabPage.evaluate((p) => {
    localStorage.setItem('buyer_current_profile', JSON.stringify(p));
  }, mockProfile);
  await dashTabPage.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
  await dashTabPage.waitForTimeout(600);
  await dashTabPage.screenshot({ path: path.join(outDir, 'buyer_dashboard_tablet.png'), fullPage: true });
  console.log('Saved buyer_dashboard_tablet.png');

  // Capture Dashboard Overview (Mobile)
  const dashMobContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const dashMobPage = await dashMobContext.newPage();
  await dashMobPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await dashMobPage.evaluate((p) => {
    localStorage.setItem('buyer_current_profile', JSON.stringify(p));
  }, mockProfile);
  await dashMobPage.goto('http://localhost:5173/buyer-dashboard', { waitUntil: 'networkidle' });
  await dashMobPage.waitForTimeout(600);
  await dashMobPage.screenshot({ path: path.join(outDir, 'buyer_dashboard_mobile.png'), fullPage: true });
  console.log('Saved buyer_dashboard_mobile.png');

  // Capture Crops Marketplace View
  await dashPage.goto('http://localhost:5173/buyer-dashboard/crops', { waitUntil: 'networkidle' });
  await dashPage.waitForTimeout(600);
  await dashPage.screenshot({ path: path.join(outDir, 'buyer_dashboard_crops.png'), fullPage: true });
  console.log('Saved buyer_dashboard_crops.png');

  await browser.close();
  console.log('All buyer pages captured successfully!');
}

run().catch(err => {
  console.error('Error capturing buyer pages:', err);
  process.exit(1);
});
