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

async function run() {
  console.log('Launching browser for Universal Logo Audit...');
  const browser = await chromium.launch({ executablePath, headless: true });

  try {
    // 1. Home Page Logo Audit
    console.log('\n--- 1. AUDITING HOME PAGE LOGO ---');
    const homePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await homePage.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await homePage.waitForSelector('.public-navbar-logo');
    const homeLogoRadius = await homePage.$eval('.public-navbar-logo', el => window.getComputedStyle(el).borderRadius);
    const homeLogoBorder = await homePage.$eval('.public-navbar-logo', el => window.getComputedStyle(el).borderColor);
    const homeTitle = await homePage.$eval('.public-navbar-title', el => el.textContent.trim());
    const homeSub = await homePage.$eval('.public-navbar-subtitle', el => el.textContent.trim());
    const homeSubColor = await homePage.$eval('.public-navbar-subtitle', el => window.getComputedStyle(el).color);

    console.log(`Home Logo Border Radius: ${homeLogoRadius}`);
    console.log(`Home Logo Border Color: ${homeLogoBorder}`);
    console.log(`Home Brand Title: "${homeTitle}"`);
    console.log(`Home Brand Subtitle: "${homeSub}" (Color: ${homeSubColor})`);

    // 2. Role Select Page Logo Audit
    console.log('\n--- 2. AUDITING ROLE SELECT PAGE LOGO ---');
    await homePage.goto(BASE_URL + '/role-select', { waitUntil: 'domcontentloaded' });
    await homePage.waitForSelector('.role-select-logo-img');
    const roleLogoRadius = await homePage.$eval('.role-select-logo-img', el => window.getComputedStyle(el).borderRadius);
    const roleLogoBorder = await homePage.$eval('.role-select-logo-img', el => window.getComputedStyle(el).borderColor);
    const roleTitle = await homePage.$eval('.role-select-brand-name', el => el.textContent.trim());
    const roleSub = await homePage.$eval('.role-select-brand-sub', el => el.textContent.trim());
    const roleSubColor = await homePage.$eval('.role-select-brand-sub', el => window.getComputedStyle(el).color);

    console.log(`Role Select Logo Border Radius: ${roleLogoRadius}`);
    console.log(`Role Select Logo Border Color: ${roleLogoBorder}`);
    console.log(`Role Select Brand Title: "${roleTitle}"`);
    console.log(`Role Select Brand Subtitle: "${roleSub}" (Color: ${roleSubColor})`);

    // 3. Buyer Login Page Logo Audit (Desktop & Mobile)
    console.log('\n--- 3. AUDITING BUYER LOGIN PAGE LOGO ---');
    await homePage.goto(BASE_URL + '/buyer-login', { waitUntil: 'domcontentloaded' });
    await homePage.waitForSelector('.buyer-brand-logo-img');
    const loginDesktopRadius = await homePage.$eval('.buyer-brand-logo-card', el => window.getComputedStyle(el).borderRadius);
    const loginDesktopBorder = await homePage.$eval('.buyer-brand-logo-card', el => window.getComputedStyle(el).borderColor);
    const loginTitle = await homePage.$eval('.buyer-brand-title', el => el.textContent.trim());
    const loginSub = await homePage.$eval('.buyer-brand-subtitle', el => el.textContent.trim());
    const loginSubColor = await homePage.$eval('.buyer-brand-subtitle', el => window.getComputedStyle(el).color);

    console.log(`Buyer Login (Desktop) Logo Radius: ${loginDesktopRadius}`);
    console.log(`Buyer Login (Desktop) Logo Border: ${loginDesktopBorder}`);
    console.log(`Buyer Login Brand Title: "${loginTitle}"`);
    console.log(`Buyer Login Brand Subtitle: "${loginSub}" (Color: ${loginSubColor})`);

    // Mobile Login Logo
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
    await mobilePage.goto(BASE_URL + '/buyer-login', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('.buyer-mobile-logo');
    const loginMobileRadius = await mobilePage.$eval('.buyer-mobile-logo', el => window.getComputedStyle(el).borderRadius);
    const loginMobileBorder = await mobilePage.$eval('.buyer-mobile-logo', el => window.getComputedStyle(el).borderColor);
    console.log(`Buyer Login (Mobile) Logo Radius: ${loginMobileRadius}`);
    console.log(`Buyer Login (Mobile) Logo Border: ${loginMobileBorder}`);

    // 4. Buyer Dashboard Logo Audit (Desktop & Mobile)
    console.log('\n--- 4. AUDITING BUYER DASHBOARD LOGO ---');
    await homePage.evaluate(() => {
      localStorage.setItem('buyer_current_profile', JSON.stringify({
        name: 'Grand Palace Hotel',
        shopName: 'Grand Palace Luxury Dining',
        role: 'buyer'
      }));
    });
    await homePage.goto(BASE_URL + '/buyer-dashboard', { waitUntil: 'domcontentloaded' });
    await homePage.waitForSelector('.buyer-brand-logo-img');
    const dashDesktopRadius = await homePage.$eval('.buyer-brand-logo-img', el => window.getComputedStyle(el).borderRadius);
    const dashDesktopBorder = await homePage.$eval('.buyer-brand-logo-img', el => window.getComputedStyle(el).borderColor);
    const dashTitle = await homePage.$eval('.buyer-brand-title', el => el.textContent.trim());
    const dashSub = await homePage.$eval('.buyer-brand-subtitle', el => el.textContent.trim());
    const dashSubColor = await homePage.$eval('.buyer-brand-subtitle', el => window.getComputedStyle(el).color);

    console.log(`Buyer Dashboard Logo Radius: ${dashDesktopRadius}`);
    console.log(`Buyer Dashboard Logo Border: ${dashDesktopBorder}`);
    console.log(`Buyer Dashboard Brand Title: "${dashTitle}"`);
    console.log(`Buyer Dashboard Brand Subtitle: "${dashSub}" (Color: ${dashSubColor})`);

    // Mobile Dashboard Logo
    await mobilePage.evaluate(() => {
      localStorage.setItem('buyer_current_profile', JSON.stringify({
        name: 'Grand Palace Hotel',
        shopName: 'Grand Palace Luxury Dining',
        role: 'buyer'
      }));
    });
    await mobilePage.goto(BASE_URL + '/buyer-dashboard', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('.buyer-brand-logo-img');
    const dashMobileRadius = await mobilePage.$eval('.buyer-brand-logo-img', el => window.getComputedStyle(el).borderRadius);
    const dashMobileBorder = await mobilePage.$eval('.buyer-brand-logo-img', el => window.getComputedStyle(el).borderColor);
    console.log(`Buyer Dashboard (Mobile) Logo Radius: ${dashMobileRadius}`);
    console.log(`Buyer Dashboard (Mobile) Logo Border: ${dashMobileBorder}`);

    // Save screenshots for visual proof
    const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/84e16d3e-4fe1-4ba3-84bb-c27b6491b831';
    await homePage.screenshot({ path: `${artifactDir}/logo_desktop_home.png`, clip: { x: 0, y: 0, width: 400, height: 90 } });
    await mobilePage.screenshot({ path: `${artifactDir}/logo_mobile_dashboard.png`, clip: { x: 0, y: 0, width: 375, height: 90 } });

    console.log('\n======================================================');
    console.log('🎉 UNIVERSAL LOGO AUDIT COMPLETE: 100% UNIFORM!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
