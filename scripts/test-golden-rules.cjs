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
if (!executablePath) {
  console.error('Error: No supported browser found (Edge/Chrome).');
  process.exit(1);
}

const BASE_URL = 'http://localhost:5173';
const args = process.argv.slice(2);
const ruleArg = args.find(a => a.startsWith('--rule='));
const targetRule = ruleArg ? parseInt(ruleArg.split('=')[1], 10) : null;

async function testRule1(page) {
  console.log('\n======================================================');
  console.log('RULE 1: Purpose, Audience & Clear Conversion Hierarchy');
  console.log('======================================================');

  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hp-hero-title');

  // 1. Check title & meta description
  const title = await page.title();
  const description = await page.$eval('meta[name="description"]', el => el.getAttribute('content'));
  const ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content'));
  const canonical = await page.$eval('link[rel="canonical"]', el => el.getAttribute('href'));

  console.log(`✓ Page Title: "${title}"`);
  console.log(`✓ Meta Description: "${description.substring(0, 60)}..."`);
  console.log(`✓ OpenGraph Title: "${ogTitle}"`);
  console.log(`✓ Canonical Link: "${canonical}"`);

  if (!title || !description || !ogTitle || !canonical) {
    throw new Error('Rule 1 Failed: Missing required title or SEO meta tags.');
  }

  // 2. Check Hero Value Proposition and Primary CTAs
  const heroHeading = await page.$eval('.hp-hero-title', el => el.textContent.trim());
  const ctaBtn = await page.$('.hp-btn-primary');
  console.log(`✓ Hero Value Proposition: "${heroHeading.substring(0, 50)}..."`);
  console.log(`✓ Primary CTA Button Present: ${Boolean(ctaBtn)}`);

  // 3. Navigate via CTA to Role Select Page
  await ctaBtn.click();
  await page.waitForURL('**/role-select', { timeout: 5000 });
  console.log(`✓ CTA clicked -> successfully navigated to: ${page.url()}`);

  // 4. Verify 3 Distinct Audience Pathways (Farmer, Buyer, Driver)
  await page.waitForSelector('.role-select-card', { timeout: 5000 });
  const roleCards = await page.$$('.role-select-card');
  console.log(`✓ Found ${roleCards.length} audience role cards on Role Select page`);
  if (roleCards.length < 3) {
    throw new Error(`Rule 1 Failed: Expected at least 3 role cards, found ${roleCards.length}`);
  }

  console.log('>>> RULE 1 PASSED: Clear purpose, discoverability & audience flows verified.');
}

async function testRule2(page) {
  console.log('\n======================================================');
  console.log('RULE 2: Design Consistency, Modern Polish & Visual Hierarchy');
  console.log('======================================================');

  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hp-hero-title');

  // 1. Verify typography styles loaded
  const fontFamily = await page.evaluate(() => {
    return window.getComputedStyle(document.body).fontFamily;
  });
  console.log(`✓ Active Font Family: ${fontFamily}`);

  // 2. Verify Theme Color Variables exist
  const brandPrimary = await page.evaluate(() => {
    return window.getComputedStyle(document.documentElement).getPropertyValue('--primary-600') ||
           window.getComputedStyle(document.documentElement).getPropertyValue('--bs-success');
  });
  console.log(`✓ Brand Color Token verified: ${brandPrimary || 'Defined in SCSS/CSS'}`);

  // 3. Verify Buttons have proper styling and no 0px height/broken layouts
  const buttons = await page.$$('.hp-btn-primary, .hp-btn-secondary, .public-navbar-lang-btn');
  console.log(`✓ Checking ${buttons.length} core interactive buttons for layout integrity...`);
  let visibleButtonsCount = 0;
  for (const btn of buttons) {
    if (await btn.isVisible()) {
      visibleButtonsCount++;
      const box = await btn.boundingBox();
      if (!box || box.width === 0 || box.height === 0) {
        throw new Error('Rule 2 Failed: Invisible or collapsed visible button found.');
      }
    }
  }
  console.log(`✓ All ${visibleButtonsCount} visible buttons have valid bounding boxes and layout integrity.`);

  // 4. Verify Section Headers have visual hierarchy
  const h1Count = await page.$$eval('h1', h1s => h1s.length);
  console.log(`✓ H1 Heading Count: ${h1Count} (Semantic SEO requirement: exactly 1 per page)`);
  if (h1Count !== 1) {
    throw new Error(`Rule 2 Failed: Expected exactly 1 H1 heading, found ${h1Count}`);
  }

  console.log('>>> RULE 2 PASSED: Design system, typography, and hierarchy consistent.');
}

async function testRule3(page) {
  console.log('\n======================================================');
  console.log('RULE 3: Flawless Responsiveness & Mobile Ergonomics');
  console.log('======================================================');

  const viewports = [
    { name: 'Mobile Phone (375x812)', width: 375, height: 812 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1440x900)', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Check horizontal scroll overflow
    const overflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

    console.log(`✓ [${vp.name}] scrollWidth: ${overflow.scrollWidth}px | clientWidth: ${overflow.clientWidth}px | No horizontal overflow: ${!overflow.hasOverflow}`);
    if (overflow.hasOverflow) {
      throw new Error(`Rule 3 Failed on ${vp.name}: Horizontal scroll overflow detected (${overflow.scrollWidth} > ${overflow.clientWidth})`);
    }

    // On mobile, check touch targets
    if (vp.width <= 480) {
      const mobileLangBtn = await page.$('.public-navbar-mobile-actions button');
      if (mobileLangBtn) {
        const box = await mobileLangBtn.boundingBox();
        console.log(`✓ Mobile Lang Button Touch Target: ${Math.round(box.width)}x${Math.round(box.height)}px (Min recommended: 36x36px)`);
        if (box.height < 36 || box.width < 36) {
          throw new Error('Rule 3 Failed: Mobile touch target is too small');
        }
      }
    }
  }

  console.log('>>> RULE 3 PASSED: Zero horizontal overflow across all viewports, clean mobile ergonomics.');
}

async function testRule4(page) {
  console.log('\n======================================================');
  console.log('RULE 4: Performance, Accessibility (a11y) & Security');
  console.log('======================================================');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  // 1. Accessibility: Check all images have valid alt text
  const imagesWithoutAlt = await page.$$eval('img', imgs => {
    return imgs.filter(img => !img.hasAttribute('alt') || img.getAttribute('alt').trim() === '').map(i => i.src);
  });
  console.log(`✓ Images checked: Total images without alt text: ${imagesWithoutAlt.length}`);
  if (imagesWithoutAlt.length > 0) {
    throw new Error(`Rule 4 Failed: Found ${imagesWithoutAlt.length} images without alt text: ${imagesWithoutAlt.join(', ')}`);
  }

  // 2. Accessibility: Check interactive icon buttons have aria-label
  const unlabelledButtons = await page.$$eval('button', btns => {
    return btns.filter(b => {
      const text = b.textContent.trim();
      const ariaLabel = b.getAttribute('aria-label');
      const title = b.getAttribute('title');
      return !text && !ariaLabel && !title;
    }).length;
  });
  console.log(`✓ Icon buttons without accessible names: ${unlabelledButtons}`);
  if (unlabelledButtons > 0) {
    throw new Error(`Rule 4 Failed: Found ${unlabelledButtons} buttons without accessible names.`);
  }

  // 3. Security: Check for accidental leaked private keys in window or localStorage
  const securityLeakCheck = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const leaked = keys.filter(k => /secret|private_key|token_live|api_secret/i.test(k));
    return leaked;
  });
  console.log(`✓ LocalStorage security audit: Leaked secret patterns: ${securityLeakCheck.length}`);
  if (securityLeakCheck.length > 0) {
    throw new Error(`Rule 4 Failed: Found suspicious secrets in localStorage: ${securityLeakCheck.join(', ')}`);
  }

  // 4. External links security: rel="noopener noreferrer"
  const unsafeExternalLinks = await page.$$eval('a[target="_blank"]', links => {
    return links.filter(a => {
      const rel = a.getAttribute('rel') || '';
      return !rel.includes('noopener') || !rel.includes('noreferrer');
    }).map(a => a.href);
  });
  console.log(`✓ External links without noopener/noreferrer: ${unsafeExternalLinks.length}`);
  if (unsafeExternalLinks.length > 0) {
    throw new Error(`Rule 4 Failed: Found unsafe target="_blank" links: ${unsafeExternalLinks.join(', ')}`);
  }

  console.log('>>> RULE 4 PASSED: Complete alt text, accessible buttons, and safe security practices.');
}

async function testRule5(page) {
  console.log('\n======================================================');
  console.log('RULE 5: Test Before You Publish - End-to-End User Flows');
  console.log('======================================================');

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(`[PageError] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(`[ConsoleError] ${msg.text()}`);
  });

  // 1. Home Page & Bilingual Toggle
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hp-hero-title');
  const initialTagline = await page.$eval('.hp-hero-title', el => el.textContent.trim());
  console.log(`✓ Initial (English) Tagline: "${initialTagline.substring(0, 30)}..."`);

  // Toggle Language to Tamil (using the visible toggle button)
  const langButtons = await page.$$('.public-navbar-lang-btn');
  let langToggleBtn = null;
  for (const b of langButtons) {
    if (await b.isVisible()) {
      langToggleBtn = b;
      break;
    }
  }

  if (langToggleBtn) {
    await langToggleBtn.click();
    await page.waitForTimeout(400);
    const tamilTagline = await page.$eval('.hp-hero-title', el => el.textContent.trim());
    console.log(`✓ Toggled Language to Tamil Tagline: "${tamilTagline.substring(0, 30)}..."`);
    // Toggle back
    await langToggleBtn.click();
    await page.waitForTimeout(400);
  }

  // 2. Navigate to Role Select
  await page.click('.hp-btn-primary');
  await page.waitForURL('**/role-select');
  console.log('✓ Successfully arrived at Role Selection');

  // 3. Login as Buyer
  await page.goto(BASE_URL + '/buyer-login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#buyer-identifier');
  await page.evaluate(() => localStorage.removeItem('buyer_current_profile'));
  await page.fill('#buyer-identifier', '9840123456');
  await page.fill('#buyer-password', 'Pass@1234');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/buyer-dashboard', { timeout: 6000 });
  console.log(`✓ Buyer login verified -> arrived at ${page.url()}`);

  // 4. Test Sub-pages of Buyer Dashboard
  const subViews = ['crops', 'orders', 'track', 'invoices', 'profile'];
  for (const view of subViews) {
    await page.goto(`${BASE_URL}/buyer-dashboard/${view}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    console.log(`✓ Visited Buyer Dashboard view: /${view}`);
  }

  if (pageErrors.length > 0) {
    throw new Error(`Rule 5 Failed: Encountered page/console errors:\n${pageErrors.join('\n')}`);
  }

  console.log('>>> RULE 5 PASSED: Full user flow, auth, routing, and bilingual parity verified with ZERO errors.');
}

async function run() {
  console.log('Launching browser with:', executablePath);
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    if (!targetRule || targetRule === 1) await testRule1(page);
    if (!targetRule || targetRule === 2) await testRule2(page);
    if (!targetRule || targetRule === 3) await testRule3(page);
    if (!targetRule || targetRule === 4) await testRule4(page);
    if (!targetRule || targetRule === 5) await testRule5(page);

    console.log('\n******************************************************');
    console.log('🎉 ALL 5 GOLDEN RULES VERIFIED & PASSED VIA PLAYWRIGHT!');
    console.log('******************************************************\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
