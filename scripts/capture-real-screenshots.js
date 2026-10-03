const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sbAdmin = createClient(
  'https://ucyulaqwnoarbbhlhdxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjeXVsYXF3bm9hcmJiaGxoZHhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc5MDk2OSwiZXhwIjoyMTA2MzY2OTY5fQ.3eUUXAYA696LK-_IiD_LCCd7_ewtjUkb2zn81QHHGEk'
);
const sbClient = createClient(
  'https://ucyulaqwnoarbbhlhdxn.supabase.co',
  'sb_publishable_AeIBkfn4hFRKY-gl7TSETA_2I0OCKYz'
);

async function captureAllReal() {
  console.log('1. Obtaining authenticated session for Dr. Bilal...');
  const { data: linkData, error: linkErr } = await sbAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'bilal@admin.com',
  });
  if (linkErr) throw linkErr;

  const otp = linkData.properties.email_otp;
  const { data: sessionData, error: sessionErr } = await sbClient.auth.verifyOtp({
    email: 'bilal@admin.com',
    token: otp,
    type: 'email',
  });
  if (sessionErr) throw sessionErr;

  const session = sessionData.session;
  console.log('Session verified for:', session.user.email);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  // First visit login to establish origin
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });

  const projectRef = 'ucyulaqwnoarbbhlhdxn';
  const storageKey = `sb-${projectRef}-auth-token`;
  const sessionStr = JSON.stringify(session);

  // Set in localStorage & cookies
  await page.evaluate((key, val) => {
    localStorage.setItem(key, val);
  }, storageKey, sessionStr);

  await page.setCookie({
    name: storageKey,
    value: encodeURIComponent(sessionStr),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
  });

  const screenshotDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  // 1. Dashboard
  console.log('Capturing real Dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'real_dashboard.png') });
  console.log('✓ real_dashboard.png');

  // 2. POS with active items
  console.log('Capturing real POS Terminal...');
  await page.goto('http://localhost:3000/dashboard/pos', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  // Click on a product card and a procedure card to populate the cart nicely
  try {
    const cards = await page.$$('.cursor-pointer, [role="button"], div[class*="border"]');
    if (cards.length > 5) {
      await cards[3].click();
      await new Promise(r => setTimeout(r, 300));
      await cards[7].click();
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) {
    console.log('Card click note:', e.message);
  }
  await page.screenshot({ path: path.join(screenshotDir, 'real_pos.png') });
  console.log('✓ real_pos.png');

  // 3. Appointments (switch to All Time to see appointments)
  console.log('Capturing real Appointments...');
  await page.goto('http://localhost:3000/dashboard/appointments', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  try {
    // Click "All Time" button
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('All Time')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log('All time click note:', e.message);
  }
  await page.screenshot({ path: path.join(screenshotDir, 'real_appointments.png') });
  console.log('✓ real_appointments.png');

  // 4. Orders
  console.log('Capturing real Orders...');
  await page.goto('http://localhost:3000/dashboard/orders', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotDir, 'real_orders.png') });
  console.log('✓ real_orders.png');

  // 5. Patients EMR
  console.log('Capturing real Patients EMR...');
  await page.goto('http://localhost:3000/dashboard/patients', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotDir, 'real_patients.png') });
  console.log('✓ real_patients.png');

  // 6. Inventory
  console.log('Capturing real Inventory...');
  await page.goto('http://localhost:3000/dashboard/inventory', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotDir, 'real_inventory.png') });
  console.log('✓ real_inventory.png');

  // 7. Treatments
  console.log('Capturing real Treatments Catalog...');
  await page.goto('http://localhost:3000/dashboard/content/treatments', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotDir, 'real_treatments.png') });
  console.log('✓ real_treatments.png');

  await browser.close();
  console.log('All 7 real screenshots captured!');
}

captureAllReal().catch(err => {
  console.error('Capture process error:', err);
  process.exit(1);
});
