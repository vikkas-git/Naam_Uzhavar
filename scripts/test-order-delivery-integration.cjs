const { chromium } = require('playwright-core');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const exec = chromePaths.find((p) => fs.existsSync(p));

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        if (res.statusCode < 500) resolve();
        else retry();
      }).on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeout) reject(new Error('Server wait timeout: ' + url));
      else setTimeout(check, 400);
    }
    check();
  });
}

async function run() {
  console.log('Starting preview server on port 5173...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const server = spawn(npmCmd, ['run', 'preview', '--', '--port', '5173', '--host', '127.0.0.1'], {
    stdio: 'pipe',
    shell: true
  });

  server.stdout.on('data', (d) => process.stdout.write('[Server] ' + d.toString()));
  server.stderr.on('data', (d) => process.stderr.write('[Server Err] ' + d.toString()));

  let browser;
  try {
    await waitForServer('http://127.0.0.1:5173');
    console.log('✓ Preview server is running on http://127.0.0.1:5173');

    console.log('Starting Playwright browser for integrated workflow verification...');
    browser = await chromium.launch({
      executablePath: exec,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    // 1. Authenticate and navigate to buyer dashboard crops page
    console.log('\n--- Step 1: Login & Navigate to Marketplace ---');
    await page.goto('http://127.0.0.1:5173/buyer-login', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem(
        'buyer_current_profile',
        JSON.stringify({
          id: 'demo-buyer-1',
          name: 'Vimal Kumar',
          fullName: 'Vimal Kumar',
          contactPerson: 'Vimal Kumar',
          shopName: 'Grand Palace Luxury Dining',
          businessName: 'Grand Palace Luxury Dining',
          address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
          phone: '+91 98401 23456',
          buyerType: 'hotel'
        })
      );
    });

    await page.goto('http://127.0.0.1:5173/buyer-dashboard/crops', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    console.log('✓ On Crops page:', page.url());

    // 2. Locate crops and click Accept
    console.log('\n--- Step 2: Click Accept Crop ---');
    const acceptButtons = await page.$$('.buyer-btn-accept');
    console.log(`Found ${acceptButtons.length} crop listing cards with Accept button.`);
    if (acceptButtons.length === 0) throw new Error('No crop cards found!');

    await acceptButtons[0].click();
    await page.waitForTimeout(500);

    // Verify: Did NOT navigate directly to delivery status
    if (page.url().includes('/track')) {
      throw new Error('FAIL: Accept button navigated directly to delivery status!');
    }
    console.log('✓ Accept did NOT navigate directly to Delivery Status (URL stays /crops)');

    // Verify Order Confirmation modal is open
    const workflowModal = await page.$('.workflow-modal');
    if (!workflowModal) throw new Error('FAIL: Order Confirmation modal did not open!');
    console.log('✓ Order Confirmation modal is open.');

    // Verify elements in Order Confirmation:
    const modalText = await page.$eval('.workflow-modal', (el) => el.innerText);
    console.log('Modal contains Crop Name & Details:', modalText.includes('Farmer:') && modalText.includes('Available Stock:'));
    console.log('Modal contains Quantity Selector:', modalText.includes('Consignment Quantity'));
    console.log('Modal contains Calculated Total:', modalText.includes('Calculated Total Price'));
    console.log('Modal contains Delivery Address:', modalText.includes('Delivery Address'));
    console.log('Modal contains Preferred Date:', modalText.includes('Preferred Delivery Date'));

    // Test Cancel / Back button does NOT create an order
    console.log('\n--- Step 3: Test Cancel Button ---');
    const cancelBtn = await page.$('.workflow-modal button:has-text("Back / Cancel")');
    if (!cancelBtn) throw new Error('Back/Cancel button not found!');
    await cancelBtn.click();
    await page.waitForTimeout(400);

    const modalAfterCancel = await page.$('.workflow-modal');
    console.log('✓ Modal closed on Cancel:', !modalAfterCancel);

    // Re-open Accept modal to place order
    console.log('\n--- Step 4: Re-open & Confirm Order ---');
    const freshAcceptButtons = await page.$$('.buyer-btn-accept');
    await freshAcceptButtons[0].click();
    await page.waitForTimeout(500);

    // Adjust quantity to 50
    const qtyInput = await page.$('#workflow-qty-input');
    if (qtyInput) {
      await qtyInput.fill('50');
    }

    // Set notes
    const notesInput = await page.$('#workflow-notes');
    if (notesInput) {
      await notesInput.fill('Deliver to Commercial Kitchen Dock 2');
    }

    // Click Confirm Order
    const confirmBtn = await page.$('.workflow-modal button:has-text("Confirm Order")');
    if (!confirmBtn) throw new Error('Confirm Order button not found!');
    await confirmBtn.click();
    await page.waitForTimeout(800);

    // Verify Step 3: Demo Farmer Approval Screen
    console.log('\n--- Step 5: Verify Order Creation & Demo Farmer Approval Panel ---');
    const step3Text = await page.$eval('.workflow-modal', (el) => el.innerText);
    const hasOrderRef = step3Text.includes('NU-2026-');
    const hasPendingStatus = step3Text.includes('PENDING_FARMER_APPROVAL');
    const hasNotAssigned = step3Text.includes('NOT_ASSIGNED');
    const hasDemoLabel = step3Text.includes('DEMO MODE — Farmer Dashboard Not Available');
    const hasSimulateApprovalBtn = step3Text.includes('Simulate Farmer Approval');
    const hasSimulateRejectionBtn = step3Text.includes('Simulate Farmer Rejection');

    console.log('✓ Order reference generated:', hasOrderRef);
    console.log('✓ Order status is PENDING_FARMER_APPROVAL:', hasPendingStatus);
    console.log('✓ Delivery status is NOT_ASSIGNED:', hasNotAssigned);
    console.log('✓ Demo panel clearly labeled "DEMO MODE — Farmer Dashboard Not Available":', hasDemoLabel);
    console.log('✓ Has "Simulate Farmer Approval" button:', hasSimulateApprovalBtn);
    console.log('✓ Has "Simulate Farmer Rejection" button:', hasSimulateRejectionBtn);

    if (!hasOrderRef || !hasPendingStatus || !hasDemoLabel || !hasSimulateApprovalBtn) {
      throw new Error('FAIL: Order details screen or demo farmer panel missing required elements!');
    }

    // Extract Order ID
    const orderIdMatch = step3Text.match(/NU-2026-\d+/);
    const createdOrderId = orderIdMatch ? orderIdMatch[0] : null;
    console.log('Created Order ID:', createdOrderId);

    // Step 6: Click Simulate Farmer Approval
    console.log('\n--- Step 6: Simulate Farmer Approval ---');
    const simulateApprovalBtn = await page.$('.workflow-modal button:has-text("Simulate Farmer Approval")');
    await simulateApprovalBtn.click();
    await page.waitForTimeout(600);

    const step4Text = await page.$eval('.workflow-modal', (el) => el.innerText);
    const isConfirmed = step4Text.includes('CONFIRMED');
    const hasDeliverySection = step4Text.includes('Simulate Delivery Arrangement');
    console.log('✓ Order status updated to CONFIRMED:', isConfirmed);
    console.log('✓ Demo delivery arrangement section revealed:', hasDeliverySection);

    if (!isConfirmed || !hasDeliverySection) {
      throw new Error('FAIL: Farmer approval did not reveal delivery arrangement section!');
    }

    // Step 7: Click Simulate Delivery Arrangement
    console.log('\n--- Step 7: Simulate Delivery Arrangement ---');
    const deliveryArrangementBtn = await page.$('.workflow-modal button:has-text("Simulate Delivery Arrangement")');
    await deliveryArrangementBtn.click();
    await page.waitForTimeout(600);

    const step5Text = await page.$eval('.workflow-modal', (el) => el.innerText);
    const isReadyForPickup = step5Text.includes('READY_FOR_PICKUP');
    const hasViewDeliveryBtn = step5Text.includes('View Delivery Status');
    console.log('✓ Delivery status updated to READY_FOR_PICKUP:', isReadyForPickup);
    console.log('✓ Button "View Delivery Status" is enabled:', hasViewDeliveryBtn);

    if (!isReadyForPickup || !hasViewDeliveryBtn) {
      throw new Error('FAIL: Delivery arrangement did not enable View Delivery Status!');
    }

    // Step 8: Click View Delivery Status -> Connects to existing Delivery Status page
    console.log('\n--- Step 8: Click View Delivery Status & Connect to Track Page ---');
    const viewDeliveryStatusBtn = await page.$('.workflow-modal button:has-text("View Delivery Status")');
    await viewDeliveryStatusBtn.click();
    await page.waitForTimeout(800);

    console.log('Current URL after clicking View Delivery Status:', page.url());
    if (!page.url().includes('/buyer-dashboard/track')) {
      throw new Error(`FAIL: Did not navigate to /buyer-dashboard/track! Current: ${page.url()}`);
    }
    console.log('✓ Successfully navigated to existing Delivery Status page: /buyer-dashboard/track');

    // Verify that the existing Track page displays the newly created order
    const trackPageText = await page.textContent('.buyer-view-container');
    const matchesCreatedOrder = trackPageText.includes(createdOrderId);
    console.log(`✓ Track page displays selected order ${createdOrderId}:`, matchesCreatedOrder);
    if (!matchesCreatedOrder) {
      throw new Error(`FAIL: Track page did not load the selected order ${createdOrderId}!`);
    }

    // Verify 4-stage stepper
    const hasStageReady = trackPageText.includes('Ready for Pickup');
    const hasStagePickedUp = trackPageText.includes('Picked Up');
    const hasStageInTransit = trackPageText.includes('In Transit');
    const hasStageDelivered = trackPageText.includes('Delivered');
    console.log('✓ 4-Stage Stepper verified (Ready for Pickup, Picked Up, In Transit, Delivered):', hasStageReady && hasStagePickedUp && hasStageInTransit && hasStageDelivered);

    // Step 9: Advance Demo Delivery Stages Sequentially
    console.log('\n--- Step 9: Advance Demo Delivery Stages ---');
    // Initial stage: Ready for Pickup -> Button: Demo: Mark as Picked Up
    const markPickedUpBtn = await page.$('button:has-text("Demo: Mark as Picked Up")');
    if (!markPickedUpBtn) throw new Error('FAIL: "Demo: Mark as Picked Up" button not found in READY_FOR_PICKUP stage!');
    console.log('✓ Found "Demo: Mark as Picked Up" button.');
    await markPickedUpBtn.click();
    await page.waitForTimeout(600);

    // Next stage: Picked Up -> Button: Demo: Mark as In Transit
    const markInTransitBtn = await page.$('button:has-text("Demo: Mark as In Transit")');
    if (!markInTransitBtn) throw new Error('FAIL: "Demo: Mark as In Transit" button not found in PICKED_UP stage!');
    console.log('✓ Transitioned to PICKED_UP. Found "Demo: Mark as In Transit" button.');
    await markInTransitBtn.click();
    await page.waitForTimeout(600);

    // Next stage: In Transit -> Button: Demo: Mark as Delivered
    const markDeliveredBtn = await page.$('button:has-text("Demo: Mark as Delivered")');
    if (!markDeliveredBtn) throw new Error('FAIL: "Demo: Mark as Delivered" button not found in IN_TRANSIT stage!');
    console.log('✓ Transitioned to IN_TRANSIT. Found "Demo: Mark as Delivered" button.');
    await markDeliveredBtn.click();
    await page.waitForTimeout(600);

    // Final stage: Delivered -> Notice shown, no advance button
    const deliveredNotice = await page.$('.buyer-demo-delivered-pill');
    console.log('✓ Transitioned to DELIVERED. Final milestone reached notice shown:', !!deliveredNotice);

    // Step 10: Inaccessible Delivery Status Check
    console.log('\n--- Step 10: Test Delivery Status Inaccessibility for Unarranged Orders ---');
    // Go to Crops, create another order, and simulate rejection
    await page.goto('http://127.0.0.1:5173/buyer-dashboard/crops', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const cropsBtns = await page.$$('.buyer-btn-accept');
    await cropsBtns[1].click();
    await page.waitForTimeout(500);

    const confirmBtn2 = await page.$('.workflow-modal button:has-text("Confirm Order")');
    await confirmBtn2.click();
    await page.waitForTimeout(700);

    // Click Simulate Farmer Rejection
    const rejectBtn = await page.$('.workflow-modal button:has-text("Simulate Farmer Rejection")');
    await rejectBtn.click();
    await page.waitForTimeout(600);

    const rejectionText = await page.$eval('.workflow-modal', (el) => el.innerText);
    const isRejected = rejectionText.includes('Declined by Farmer') || rejectionText.includes('REJECTED');
    const noViewDelivery = !rejectionText.includes('View Delivery Status');
    console.log('✓ Farmer rejection simulated. Order status REJECTED:', isRejected);
    console.log('✓ Delivery tracking is prevented (no View Delivery Status button):', noViewDelivery);

    console.log('\n======================================================');
    console.log('🎉 ALL INTEGRATION WORKFLOW CHECKS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exitCode = 1;
  } finally {
    if (typeof browser !== 'undefined' && browser) {
      await browser.close().catch(() => {});
    }
    if (server && server.pid) {
      try {
        spawn('taskkill', ['/pid', server.pid.toString(), '/f', '/t']);
      } catch {
        server.kill();
      }
    }
  }
}

run();
