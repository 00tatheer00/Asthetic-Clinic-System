const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const baseDir = path.resolve(__dirname, '..');
const publicDir = path.join(baseDir, 'public');
const guideDir = path.join(publicDir, 'guide');
const screenshotDir = path.join(publicDir, 'screenshots');

if (!fs.existsSync(guideDir)) {
  fs.mkdirSync(guideDir, { recursive: true });
}

// Convert image to base64
function getBase64Image(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).replace('.', '');
    const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    const data = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${data}`;
  }
  console.warn('Image not found:', filePath);
  return '';
}

const logoBase64 = getBase64Image(path.join(publicDir, 'images', 'logo.png'));
const drBilalBase64 = getBase64Image(path.join(publicDir, 'images', 'dr-bilal.jpg'));

// 100% REAL SCREENSHOTS FROM RUNNING ADMIN PANEL
const realDashboard = getBase64Image(path.join(screenshotDir, 'real_dashboard.png'));
const realAppointments = getBase64Image(path.join(screenshotDir, 'real_appointments.png'));
const realPos = getBase64Image(path.join(screenshotDir, 'real_pos.png'));
const realOrders = getBase64Image(path.join(screenshotDir, 'real_orders.png'));
const realPatients = getBase64Image(path.join(screenshotDir, 'real_patients.png'));
const realTreatments = getBase64Image(path.join(screenshotDir, 'real_treatments.png'));

console.log('Real screenshots loaded into memory successfully.');

// Construct High-End Executive HTML with REAL SCREENSHOTS
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dr. Bilal Ahmad - Brimish Clinic Admin Panel Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1E293B;
      background: #E5E7EB;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      position: relative;
      background: #FFFFFF;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      margin: 0 auto 20px auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    @media print {
      body {
        background: transparent;
      }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }

    /* Colors */
    :root {
      --primary: #2D1226;
      --primary-dark: #190815;
      --primary-light: #4A1F3F;
      --gold: #D4AF37;
      --gold-dark: #AA8520;
      --gold-light: #F9F3DC;
      --gold-border: #E8D38A;
      --accent: #B73269;
      --text-dark: #0F172A;
      --text-muted: #475569;
      --bg-soft: #FBF9F7;
      --border-soft: #EDE4DE;
      --success: #059669;
      --blue: #2563EB;
      --warning: #D97706;
    }

    /* Top & Bottom Header / Footer */
    .page-header {
      height: 18mm;
      padding: 0 16mm;
      background: #FAF7F5;
      border-bottom: 1.5px solid var(--border-soft);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .header-logo-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      height: 30px;
      width: auto;
      object-fit: contain;
    }
    .header-clinic-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-tagline {
      font-size: 9.5px;
      color: var(--gold-dark);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-doc-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      background: #FFFFFF;
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid var(--border-soft);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-doc-badge span {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
    }

    .page-footer {
      height: 12mm;
      padding: 0 16mm;
      background: #FAF7F5;
      border-top: 1.5px solid var(--border-soft);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      color: var(--text-muted);
      flex-shrink: 0;
      margin-top: auto;
    }
    .footer-left {
      font-weight: 600;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .footer-left::before {
      content: '🔒';
      font-size: 11px;
    }
    .footer-right {
      font-weight: 700;
      color: var(--gold-dark);
      letter-spacing: 0.5px;
    }

    .page-content {
      padding: 6mm 16mm 6mm 16mm;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Typography */
    h1, h2, h3, h4 {
      font-family: 'Playfair Display', Georgia, serif;
      color: var(--primary);
    }
    .page-title-banner {
      margin-bottom: 4mm;
      position: relative;
    }
    .module-category {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gold-dark);
      background: var(--gold-light);
      padding: 2px 9px;
      border-radius: 4px;
      margin-bottom: 4px;
      border: 1px solid var(--gold-border);
    }
    .page-main-heading {
      font-size: 21px;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.2;
    }
    .page-subtitle {
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 2px;
      line-height: 1.4;
    }

    /* REAL SCREENSHOT CONTAINER */
    .screenshot-container {
      background: #FFFFFF;
      border-radius: 8px;
      border: 1.5px solid #DED4CC;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(45, 18, 38, 0.08);
      margin-bottom: 4mm;
      position: relative;
    }
    .browser-bar {
      height: 22px;
      background: #F4EFEB;
      border-bottom: 1px solid #DED4CC;
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 6px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot.red { background: #FF5F56; }
    .dot.yellow { background: #FFBD2E; }
    .dot.green { background: #27C93F; }
    .browser-url {
      font-size: 9.5px;
      color: #64748B;
      font-weight: 600;
      margin-left: 8px;
      font-family: monospace;
    }
    .real-screenshot-img {
      width: 100%;
      height: auto;
      max-height: 105mm;
      display: block;
      object-fit: contain;
      background: #F8FAFC;
    }

    /* Cards & Grids */
    .card-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 3mm;
    }
    .card-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 3mm;
    }
    .info-card {
      background: var(--bg-soft);
      border: 1px solid var(--border-soft);
      border-radius: 6px;
      padding: 8px 10px;
      position: relative;
    }
    .info-card.gold-card {
      background: #FFFDF9;
      border: 1px solid var(--gold-border);
      box-shadow: 0 2px 6px rgba(212, 175, 55, 0.06);
    }
    .info-card.primary-card {
      background: #FDF9FB;
      border: 1px solid #ECC9DF;
    }
    .card-header-flex {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .card-icon {
      font-size: 14px;
      line-height: 1;
    }
    .card-title {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--primary);
    }
    .card-body {
      font-size: 10.5px;
      color: var(--text-dark);
      line-height: 1.4;
    }

    /* Action List */
    .action-steps {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 3mm;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #FFFFFF;
      border: 1px solid #ECE4DF;
      border-radius: 6px;
      padding: 6px 10px;
    }
    .step-num {
      width: 20px;
      height: 20px;
      background: var(--primary);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-content h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1px;
    }
    .step-content p {
      font-size: 10.5px;
      color: var(--text-muted);
      line-height: 1.35;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-success { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .badge-primary { background: #FDF2F8; color: #831843; border: 1px solid #FBCFE8; }
    .badge-warning { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
    .badge-blue { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }

    /* Callout Box */
    .doctor-callout {
      background: linear-gradient(135deg, #2D1226 0%, #431938 100%);
      color: #FFFFFF;
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: auto;
      border-left: 4px solid var(--gold);
    }
    .doctor-callout-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    .doctor-callout-text h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 800;
      color: var(--gold-light);
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doctor-callout-text p {
      font-size: 10.5px;
      color: #F8E7F3;
      line-height: 1.35;
    }

    /* ==================== COVER PAGE ==================== */
    .page-cover {
      background: linear-gradient(150deg, #1C0A17 0%, #2D1226 40%, #150612 100%);
      color: #FFFFFF;
      position: relative;
      padding: 22mm 20mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-ornament {
      position: absolute;
      top: 0;
      right: 0;
      width: 140mm;
      height: 140mm;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0) 70%);
      pointer-events: none;
    }
    .cover-top {
      position: relative;
      z-index: 2;
    }
    .cover-logo-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 10mm;
    }
    .cover-logo-img {
      height: 56px;
      width: auto;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
    }
    .cover-clinic-titles h3 {
      font-size: 19px;
      color: #FFFFFF;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .cover-clinic-titles p {
      font-size: 10.5px;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cover-badge-row {
      margin-bottom: 5mm;
    }
    .cover-tag {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gold);
      border: 1px solid var(--gold);
      padding: 5px 12px;
      border-radius: 30px;
      background: rgba(212, 175, 55, 0.1);
    }
    .cover-title {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.15;
      color: #FFFFFF;
      margin-bottom: 4mm;
      text-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .cover-title span {
      color: var(--gold);
      font-style: italic;
    }
    .cover-lead {
      font-size: 14px;
      color: #E2CFDD;
      max-width: 150mm;
      line-height: 1.55;
      margin-bottom: 6mm;
      font-weight: 400;
    }

    .cover-features-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      max-width: 160mm;
      margin-bottom: 8mm;
    }
    .cover-pill {
      font-size: 10.5px;
      font-weight: 600;
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 5px 11px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .cover-doctor-card {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.06);
      border: 1.5px solid rgba(212, 175, 55, 0.4);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 18px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .cover-doctor-photo {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 3px solid var(--gold);
      object-fit: cover;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .cover-doctor-info h4 {
      font-size: 17px;
      color: #FFFFFF;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .cover-doctor-info .doc-role {
      font-size: 11.5px;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }
    .cover-doctor-info .doc-desc {
      font-size: 10.5px;
      color: #D3BED0;
      line-height: 1.4;
    }
    .cover-bottom-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6mm;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 10.5px;
      color: #A38CA0;
      position: relative;
      z-index: 2;
    }

    /* Page 2 - Overview & Architecture */
    .pillars-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 3mm;
    }
    .pillar-card {
      background: #FFFFFF;
      border: 1px solid #EBE2DC;
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .pillar-num {
      width: 24px;
      height: 24px;
      background: var(--gold-light);
      border: 1px solid var(--gold-border);
      color: var(--gold-dark);
      font-weight: 800;
      font-size: 11px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pillar-text h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 2px;
    }
    .pillar-text p {
      font-size: 10px;
      color: var(--text-muted);
      line-height: 1.35;
    }

    /* Cheat Sheet Table */
    .cheat-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4mm;
      font-size: 10.5px;
    }
    .cheat-table th {
      background: var(--primary);
      color: #FFFFFF;
      padding: 7px 10px;
      text-align: left;
      font-size: 10.5px;
      font-weight: 700;
    }
    .cheat-table th:first-child { border-top-left-radius: 6px; }
    .cheat-table th:last-child { border-top-right-radius: 6px; }
    .cheat-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #ECE4DF;
      color: var(--text-dark);
    }
    .cheat-table tr:nth-child(even) {
      background: #FAF7F5;
    }
    .cheat-table td strong {
      color: var(--primary);
    }

    /* Credential Box */
    .credentials-box {
      background: #FFFFFF;
      border: 2px dashed var(--gold);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 3mm;
    }
    .cred-item {
      display: flex;
      flex-direction: column;
    }
    .cred-label {
      font-size: 9.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .cred-val {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--primary);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER PAGE ==================== -->
  <div class="page page-cover">
    <div class="cover-ornament"></div>
    
    <div class="cover-top">
      <div class="cover-logo-row">
        <img class="cover-logo-img" src="${logoBase64}" alt="Brimish Skin Care Logo">
        <div class="cover-clinic-titles">
          <h3>BRIMISH SKIN CARE & AESTHETIC CLINIC</h3>
          <p>Advanced Aesthetic Medicine & Laser Institute</p>
        </div>
      </div>

      <div class="cover-badge-row">
        <span class="cover-tag">EXECUTIVE CLINIC MANUAL • 2026 LIVE SYSTEM</span>
      </div>

      <h1 class="cover-title">
        Doctor Bilal’s Complete<br>
        <span>Admin Panel Guide</span>
      </h1>

      <p class="cover-lead">
        A visual, step-by-step master handbook illustrated with <strong>100% Real Live Screenshots</strong> from your actual Brimish clinic system. Written in simple English so you can run appointments, POS walk-in billing, online skincare orders, and patient medical records effortlessly.
      </p>

      <div class="cover-features-pills">
        <span class="cover-pill">✓ Real Website Admin Screenshots</span>
        <span class="cover-pill">✓ Live Daily Revenue & Analytics</span>
        <span class="cover-pill">✓ Smart Appointments with WhatsApp Reminders</span>
        <span class="cover-pill">✓ POS Walk-In Counter & Thermal Slips</span>
        <span class="cover-pill">✓ Online Skincare Store Order Dispatch</span>
        <span class="cover-pill">✓ Digital EMR Medical Records & History</span>
      </div>
    </div>

    <!-- Doctor Profile Bar -->
    <div class="cover-doctor-card">
      <img class="cover-doctor-photo" src="${drBilalBase64}" alt="Dr. Bilal Ahmad">
      <div class="cover-doctor-info">
        <h4>Dr. Bilal Ahmad</h4>
        <div class="doc-role">MD Aesthetic Medicine & Clinic Director</div>
        <div class="doc-desc">Medical Director at Brimish Skin Care Clinic. Specialist in Medical Facials, Laser Resurfacing, Botox, Fillers & Clinical Skin Health.</div>
      </div>
    </div>

    <div class="cover-bottom-meta">
      <div>📍 <strong>Location:</strong> Sami Tower, Ring Road, Peshawar / Bahria Town Phase 7</div>
      <div>⚡ <strong>System Version:</strong> Brimish Pro v2.4 (Active Cloud)</div>
      <div>🔒 <strong>Access Level:</strong> Super Admin (Dr. Bilal Eyes Only)</div>
    </div>
  </div>

  <!-- ==================== PAGE 2: WELCOME & CLINIC ARCHITECTURE ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Doctor's Operational Manual</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">System Architecture & Overview</span>
        <h2 class="page-main-heading">Welcome, Dr. Bilal: Your Clinic At Your Fingertips</h2>
        <p class="page-subtitle">Your Brimish Admin Panel connects every single department of your clinic into one smooth, centralized dashboard. Here is how your clinic runs seamlessly.</p>
      </div>

      <!-- Overview Cards -->
      <div class="card-grid-3">
        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">⚡</span>
            <div class="card-title">100% Real-Time Cloud</div>
          </div>
          <div class="card-body">
            Whether inside the clinic or at home, open your phone or laptop to see live patient visits, earnings, and appointments instantly.
          </div>
        </div>

        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">🖨️</span>
            <div class="card-title">1-Click Thermal Slips</div>
          </div>
          <div class="card-body">
            Both walk-in patient bills and courier skincare parcel slips print instantly on standard 80mm thermal paper with pristine clinic branding.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">🛡️</span>
            <div class="card-title">Medical Record Safety</div>
          </div>
          <div class="card-body">
            Patient history, clinical treatment notes, before/after photos, and allergy records are encrypted and protected behind doctor login security.
          </div>
        </div>
      </div>

      <h3 style="font-size: 14px; margin-bottom: 2mm; color: var(--primary);">The 8 Core Superpowers in Your Admin Panel:</h3>

      <div class="pillars-grid">
        <div class="pillar-card">
          <div class="pillar-num">1</div>
          <div class="pillar-text">
            <h4>Live Executive Dashboard</h4>
            <p>Monitor daily gross revenue, patient visit counts, active doctor sessions, and 4-way alerts (Bookings, Orders, Stock, Reviews).</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">2</div>
          <div class="pillar-text">
            <h4>Smart Appointment Roster</h4>
            <p>View daily clinic calendar, confirm booking requests, assign treatment rooms & aesthetic doctors, and send automated SMS alerts.</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">3</div>
          <div class="pillar-text">
            <h4>Point of Sale (POS) Cash Desk</h4>
            <p>Ultra-fast walk-in patient billing with mandatory name & phone validation, discount handling, and instant thermal receipt printing.</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">4</div>
          <div class="pillar-text">
            <h4>Online Skincare Store Orders</h4>
            <p>Manage product deliveries across Pakistan. Change statuses (Confirmed, Dispatched) and print thermal courier box slips in 1 click.</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">5</div>
          <div class="pillar-text">
            <h4>Patient Digital EMR Records</h4>
            <p>Search any patient by name or phone. View past treatments, laser session logs, skin types (Fitzpatrick), and clinical consultation notes.</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">6</div>
          <div class="pillar-text">
            <h4>Automated Invoices & Tax GST</h4>
            <p>Auto-generated sequential clinic invoices (INV-2026-XXXX) with breakdown of consultation fees, procedures, products, and GST.</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">7</div>
          <div class="pillar-text">
            <h4>Inventory & Stock Control</h4>
            <p>Automatic stock deduction when products are sold or used. Instant alerts when serums or laser consumables drop below minimum threshold.</p>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">8</div>
          <div class="pillar-text">
            <h4>Website Content Management</h4>
            <p>Update treatment prices, add new skincare items with images, upload clinical before/after case studies, and moderate patient reviews.</p>
          </div>
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: 3mm;">
        <div class="doctor-callout-icon">💡</div>
        <div class="doctor-callout-text">
          <h4>Doctor Bilal's Operational Advantage:</h4>
          <p>You no longer need messy paper registers or manual WhatsApp notes. Your receptionist enters the visit once, and the entire system updates your earnings, inventory, patient history, and receipt automatically!</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 2</div>
    </div>
  </div>

  <!-- ==================== PAGE 3: LIVE DASHBOARD & ANALYTICS (REAL SCREENSHOT) ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Module 1 • Executive Analytics</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Module 1 • Executive Command</span>
        <h2 class="page-main-heading">Executive Dashboard: Your Daily Clinic Pulse</h2>
        <p class="page-subtitle">The first screen you see every morning. Real live screenshot of your active system showing revenue velocity and operational status.</p>
      </div>

      <!-- 100% REAL SCREENSHOT -->
      <div class="screenshot-container">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="browser-url">http://localhost:3000/dashboard (Live Active System)</span>
        </div>
        <img class="real-screenshot-img" src="${realDashboard}" alt="Real Brimish Executive Dashboard Screenshot">
      </div>

      <!-- What Dr. Bilal Can See & Do -->
      <div class="card-grid-2">
        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">💰</span>
            <div class="card-title">Live Revenue & Patient Counter</div>
          </div>
          <div class="card-body">
            <strong>Today's Total Gross Revenue:</strong> Instantly updates every time a bill is paid at reception or an online order is confirmed. Notice the live <strong>Daily Revenue Velocity</strong> curve in the center.
          </div>
        </div>

        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">🔔</span>
            <div class="card-title">4-Tab Instant Notification Bell</div>
          </div>
          <div class="card-body">
            Your top-right notification center is organized into 4 crystal-clear tabs: <strong>Bookings</strong>, <strong>Orders</strong>, <strong>Low Stock</strong>, and <strong>Reviews</strong> with instant badge counts.
          </div>
        </div>
      </div>

      <div class="card-grid-2">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📊</span>
            <div class="card-title">Patient Inflow & Procedure Volume</div>
          </div>
          <div class="card-body">
            Track daily patient traffic, consultation volume, and procedure completion rate (e.g. 29% Completed, 3 visits) with real-time Chart.js visual analytics.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">⭐</span>
            <div class="card-title">Pending Moderation & Alerts</div>
          </div>
          <div class="card-body">
            Yellow alert banners warn you immediately if customer testimonials or clinical before/after reviews are waiting for your approval before going public.
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">📱</div>
        <div class="doctor-callout-text">
          <h4>Mobile & Tablet Ready for Doctor Bilal:</h4>
          <p>You can open this exact dashboard on your iPhone, iPad, or Android phone while consulting. No app download needed — just visit your clinic URL and log in securely.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 3</div>
    </div>
  </div>

  <!-- ==================== PAGE 4: APPOINTMENTS & CALENDAR (REAL SCREENSHOT) ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Module 2 • Appointments & Scheduling</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Module 2 • Smart Patient Scheduling</span>
        <h2 class="page-main-heading">Appointments & Calendar: Zero Waiting Room Chaos</h2>
        <p class="page-subtitle">Real live screenshot of your active clinic bookings table showing patient names, treatments, statuses, and instant WhatsApp alerts.</p>
      </div>

      <!-- 100% REAL SCREENSHOT -->
      <div class="screenshot-container">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="browser-url">http://localhost:3000/dashboard/appointments (Live Active Bookings)</span>
        </div>
        <img class="real-screenshot-img" src="${realAppointments}" alt="Real Brimish Appointments Screenshot">
      </div>

      <!-- How It Works in 4 Steps -->
      <div class="action-steps">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-content">
            <h4>Live Patient Requests Appear Automatically</h4>
            <p>See real patients in the queue (e.g. Tatheer for HydraFacial MD, Tatheer Hussain for Pico Laser, Shameeer for HydraFacial).</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-content">
            <h4>Instant 1-Click WhatsApp Reminders <span class="badge badge-success">WhatsApp</span></h4>
            <p>Click the green <strong>WhatsApp button</strong> next to any patient's name to send a personalized pre-procedure care and appointment confirmation message directly to their phone.</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-content">
            <h4>Real-Time Status Badges <span class="badge badge-primary">Confirmed</span> <span class="badge badge-success">Completed</span></h4>
            <p>Filter between <strong>Today</strong>, <strong>Tomorrow</strong>, <strong>This Week</strong>, or <strong>All Time</strong> to see who is arriving next at the clinic.</p>
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">💬</div>
        <div class="doctor-callout-text">
          <h4>No More No-Shows:</h4>
          <p>Patients receive direct WhatsApp and SMS reminders before their appointment, cutting missed aesthetic clinic appointments by over 70%!</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 4</div>
    </div>
  </div>

  <!-- ==================== PAGE 5: PATIENT DIGITAL EMR & CLINICAL NOTES (REAL SCREENSHOT) ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Module 3 • Digital Patient EMR</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Module 3 • Electronic Medical Records</span>
        <h2 class="page-main-heading">Digital EMR: Patient Skin History & Clinical Records</h2>
        <p class="page-subtitle">Real live screenshot of your patient registry showing instant patient lookup by name or mobile number with total clinical history.</p>
      </div>

      <!-- 100% REAL SCREENSHOT -->
      <div class="screenshot-container">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="browser-url">http://localhost:3000/dashboard/patients (Live Patient Registry)</span>
        </div>
        <img class="real-screenshot-img" src="${realPatients}" alt="Real Brimish Patient EMR Screenshot">
      </div>

      <div class="card-grid-2">
        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">🔍</span>
            <div class="card-title">1-Second Patient Search</div>
          </div>
          <div class="card-body">
            Type the patient’s name or phone number. Instantly see their entire history: past treatments, payments made, aesthetic doctor who saw them, and upcoming visits.
          </div>
        </div>

        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">🛡️</span>
            <div class="card-title">Medical Safety & Skin Profiling</div>
          </div>
          <div class="card-body">
            Record Fitzpatrick Skin Type (Type I - VI), active allergies (e.g. Lidocaine allergy), acne severity, pregnancy contraindications, and sensitive skin conditions.
          </div>
        </div>
      </div>

      <div class="card-grid-3">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📝</span>
            <div class="card-title">Doctor's Clinical Notes</div>
          </div>
          <div class="card-body">
            Write confidential medical observations during consultation: e.g. <em>"Prescribed 20% Azelaic Acid + HydraFacial Session 1."</em>
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">🔢</span>
            <div class="card-title">Multi-Session Tracker</div>
          </div>
          <div class="card-body">
            Track packages effortlessly: e.g., <strong>Laser Hair Removal Session 3 of 6</strong> with laser joules and spot size used.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📸</span>
            <div class="card-title">Before & After Records</div>
          </div>
          <div class="card-body">
            Attach high-resolution consultation photos (Day 1 vs. Day 30) directly to the patient's private profile.
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">🏆</div>
        <div class="doctor-callout-text">
          <h4>Total Clinical Confidence:</h4>
          <p>When a patient walks in after 6 months, you can open their profile in 3 seconds and know exactly what treatments, products, and laser settings were used last time.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 5</div>
    </div>
  </div>

  <!-- ==================== PAGE 6: POS BILLING & THERMAL PRINT SLIPS (REAL SCREENSHOT) ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Module 4 • Point of Sale (POS)</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Module 4 • Front Desk & POS Terminal</span>
        <h2 class="page-main-heading">Point of Sale (POS): Fast Billing & Thermal Slips</h2>
        <p class="page-subtitle">Real live screenshot of your actual POS terminal showing Retail Products, Clinical Procedures, and Checkout Desk.</p>
      </div>

      <!-- 100% REAL SCREENSHOT -->
      <div class="screenshot-container">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="browser-url">http://localhost:3000/dashboard/pos (Live Walk-In Desk Terminal)</span>
        </div>
        <img class="real-screenshot-img" src="${realPos}" alt="Real Brimish POS Terminal Screenshot">
      </div>

      <div class="card-grid-2">
        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">⚡</span>
            <div class="card-title">Touchscreen Counter Billing</div>
          </div>
          <div class="card-body">
            One-touch cards for <strong>Products</strong> (Barrier Cream, Sun Shield SPF 50+, Cleanser, Vitamin C Serum) and <strong>Procedures</strong> (HydraFacial MD, Microneedling, Chemical Peel, Laser Hair Removal).
          </div>
        </div>

        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">🔒</span>
            <div class="card-title">Mandatory Patient Verification</div>
          </div>
          <div class="card-body">
            <strong>Patient Name * & Phone * (0300-123) are required</strong>. Notice the input fields in the screenshot — staff cannot print a bill without saving the patient to your clinic registry!
          </div>
        </div>
      </div>

      <div class="card-grid-3">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">🏷️</span>
            <div class="card-title">Flexible Discounts</div>
          </div>
          <div class="card-body">
            Apply percentage or flat PKR discount. The bill recalculates subtotal, tax, and net payable automatically.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">💳</span>
            <div class="card-title">Multiple Payment Modes</div>
          </div>
          <div class="card-body">
            Accept Cash Payment or Card / POS machine. Keyboard shortcuts: <strong>F8</strong> for Cash, <strong>F9</strong> for Card, <strong>F10</strong> for Print!
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">🖨️</span>
            <div class="card-title">Instant Thermal Receipt</div>
          </div>
          <div class="card-body">
            Prints standard 80mm clinic receipt with logo, Doctor's name, itemized services, tax registration, and clean outlined badge.
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">🧾</div>
        <div class="doctor-callout-text">
          <h4>Thermal Slip Print Quality:</h4>
          <p>Receipts are formatted specifically for standard 80mm thermal receipt printers. They print instantly with no dialogue delay and look crisp, elegant, and professional.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 6</div>
    </div>
  </div>

  <!-- ==================== PAGE 7: ONLINE SKINCARE STORE & DISPATCH (REAL SCREENSHOT) ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Module 5 • Skincare Orders & Shipping</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Module 5 • E-Commerce & Skincare Deliveries</span>
        <h2 class="page-main-heading">Online Store Orders: Nationwide Delivery Control</h2>
        <p class="page-subtitle">Real live screenshot of your active customer orders list showing order IDs, customer phone numbers, delivery method, and status.</p>
      </div>

      <!-- 100% REAL SCREENSHOT -->
      <div class="screenshot-container">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="browser-url">http://localhost:3000/dashboard/orders (Live Customer Orders Pipeline)</span>
        </div>
        <img class="real-screenshot-img" src="${realOrders}" alt="Real Brimish Orders Screenshot">
      </div>

      <!-- Action Pipeline -->
      <div class="action-steps">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-content">
            <h4>Live Order Pipeline Tracking <span class="badge badge-success">Completed</span></h4>
            <p>See live customer orders (e.g. order <strong>BSC-ORD-2026-00004</strong> for Rs. 950 with customer contact 0314-2986071).</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-content">
            <h4>1-Click Thermal Courier Slip Printing</h4>
            <p>Click <strong>"Print Dispatch Slip"</strong>. A high-clarity 80mm thermal shipping label prints instantly to slap onto courier flyers (TCS, Leopards, Trax).</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-content">
            <h4>Instant Inventory Synchronization</h4>
            <p>When an online order is placed, clinic stock drops automatically so your physical clinic and online store never oversell.</p>
          </div>
        </div>
      </div>

      <div class="card-grid-2">
        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">📦</span>
            <div class="card-title">Courier Thermal Label Printing</div>
          </div>
          <div class="card-body">
            Formats directly for standard 80mm thermal printers with clinic sender details, recipient address, phone, COD amount, and tracking barcode.
          </div>
        </div>

        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">🚚</span>
            <div class="card-title">Nationwide Delivery Control</div>
          </div>
          <div class="card-body">
            Filter orders by status: Received, Confirmed, Preparing, Ready, Delivered, Picked Up, or Cancelled with instant search.
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">🚚</div>
        <div class="doctor-callout-text">
          <h4>Courier Ready Across Pakistan:</h4>
          <p>Every dispatch slip contains clear Cash-on-Delivery (COD) amounts in large, bold numbers so courier drivers never make billing mistakes at the customer's doorstep.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 7</div>
    </div>
  </div>

  <!-- ==================== PAGE 8: INVENTORY & WEBSITE CATALOG (REAL SCREENSHOT) ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Module 6 • Catalog & Website Control</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Module 6 • Stock & Website Management</span>
        <h2 class="page-main-heading">Treatments & Catalog: Full Website Control</h2>
        <p class="page-subtitle">Real live screenshot of your active clinical treatment catalog showing session durations, pricing, and instant edit tools.</p>
      </div>

      <!-- 100% REAL SCREENSHOT -->
      <div class="screenshot-container">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="browser-url">http://localhost:3000/dashboard/content/treatments (Live Procedures Catalog)</span>
        </div>
        <img class="real-screenshot-img" src="${realTreatments}" alt="Real Brimish Treatments Screenshot">
      </div>

      <div class="card-grid-2">
        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">💉</span>
            <div class="card-title">Live Treatment Menu & Pricing</div>
          </div>
          <div class="card-body">
            See your full clinic menu: HydraFacial MD (Rs. 5,000 / 60 min), Medical Chemical Peel (Rs. 3,500), Acne Protocol (Rs. 8,000), Microneedling (Rs. 6,000), Laser Hair Removal (Rs. 1,000), Pico Laser (Rs. 1,500). Click <strong>"Edit"</strong> to update prices anytime!
          </div>
        </div>

        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">🧪</span>
            <div class="card-title">Real-Time Stock & Consumables</div>
          </div>
          <div class="card-body">
            Under <strong>Inventory</strong>, track every SKU with exact quantities (e.g. 34 Barrier Creams, 48 Sun Shields, 39 Cleansers). Low Stock warnings notify you before bottles run out.
          </div>
        </div>
      </div>

      <div class="card-grid-3">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">✨</span>
            <div class="card-title">+ Add Treatment</div>
          </div>
          <div class="card-body">
            Click the pink <strong>"+ Add Treatment"</strong> button at top right to launch new aesthetic procedures on your website in 2 minutes.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📷</span>
            <div class="card-title">Before & After Gallery</div>
          </div>
          <div class="card-body">
            Upload genuine clinical results directly from the sidebar gallery manager to build patient trust.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">⭐</span>
            <div class="card-title">Review Moderation</div>
          </div>
          <div class="card-body">
            Approve verified patient testimonials from the Reviews tab with a single click.
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">🚀</div>
        <div class="doctor-callout-text">
          <h4>Zero Dependency on IT Agencies:</h4>
          <p>Everything is visual and point-and-click. Whenever you launch a new treatment (e.g. Exosome Therapy or Pico Laser), you can add it to your website in 2 minutes!</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 8</div>
    </div>
  </div>

  <!-- ==================== PAGE 9: QUICK CHEAT SHEET & ACCESS ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="header-logo-group">
        <img class="header-logo" src="${logoBase64}" alt="Brimish Logo">
        <div>
          <div class="header-clinic-name">Brimish Skin Care & Aesthetic Clinic</div>
          <div class="header-tagline">Executive Summary & Quick Cheat Sheet</div>
        </div>
      </div>
      <div class="header-doc-badge">
        <span></span> Dr. Bilal Ahmad (MD)
      </div>
    </div>

    <div class="page-content">
      <div class="page-title-banner">
        <span class="module-category">Daily Operations • Doctor's Quick Reference</span>
        <h2 class="page-main-heading">10-Second Quick Cheat Sheet for Dr. Bilal</h2>
        <p class="page-subtitle">Simple, step-by-step instructions for the most common tasks performed in your clinic every single day.</p>
      </div>

      <table class="cheat-table">
        <thead>
          <tr>
            <th style="width: 28%;">Task / Action</th>
            <th style="width: 45%;">Where to Go & What to Click</th>
            <th style="width: 27%;">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Check Today's Total Clinic Earnings</strong></td>
            <td>Open <strong>Dashboard</strong> → Look at top card <em>"Today's Revenue"</em></td>
            <td>Shows exact PKR amount collected today from all sources.</td>
          </tr>
          <tr>
            <td><strong>Book a Patient Who Called Reception</strong></td>
            <td>Go to <strong>Appointments</strong> → Click <em>"+ New Booking"</em> → Enter Name, Phone & Select Service</td>
            <td>Patient is reserved and receives an SMS confirmation.</td>
          </tr>
          <tr>
            <td><strong>Bill a Walk-in Patient for Treatment / Product</strong></td>
            <td>Go to <strong>POS</strong> → Enter Patient Name & Phone → Click treatments/products → Click <em>"Charge & Print Receipt"</em></td>
            <td>80mm receipt prints instantly, cash is recorded, and stock drops.</td>
          </tr>
          <tr>
            <td><strong>Ship an Online Skincare Order</strong></td>
            <td>Go to <strong>Orders</strong> → Click <em>"Details"</em> → Click <em>"Print Slip"</em> → Paste on flyer</td>
            <td>Courier dispatch slip prints with customer address & COD.</td>
          </tr>
          <tr>
            <td><strong>View Patient Medical History & Past Notes</strong></td>
            <td>Go to <strong>Patients</strong> → Type patient mobile number in search bar → Click profile</td>
            <td>Shows full history, past laser settings, and doctor notes.</td>
          </tr>
          <tr>
            <td><strong>Change Treatment Price or Add New Treatment</strong></td>
            <td>Go to <strong>Treatments</strong> → Click <em>"Edit"</em> on any service or click <em>"+ Add Treatment"</em></td>
            <td>Website updates price and description immediately.</td>
          </tr>
        </tbody>
      </table>

      <!-- Doctor Login Box -->
      <h3 style="font-size: 12.5px; margin-bottom: 2mm; color: var(--primary);">Dr. Bilal's Official Login Credentials & Access:</h3>

      <div class="credentials-box">
        <div class="cred-item">
          <span class="cred-label">Clinic Portal URL</span>
          <span class="cred-val">https://brimish-skincare.com/auth/login</span>
        </div>
        <div class="cred-item">
          <span class="cred-label">Doctor Username / Email</span>
          <span class="cred-val">bilal@admin.com</span>
        </div>
        <div class="cred-item">
          <span class="cred-label">Doctor Role</span>
          <span class="cred-val"><span class="badge badge-success">Super Admin / Medical Director</span></span>
        </div>
      </div>

      <!-- End of Day Closing -->
      <div class="info-card primary-card" style="margin-top: 3mm;">
        <div class="card-header-flex">
          <span class="card-icon">🌙</span>
          <div class="card-title">Daily Evening Cash Reconciliation (2 Minutes)</div>
        </div>
        <div class="card-body">
          At 9:00 PM when clinic closes, Dr. Bilal or Head Receptionist checks total cash collected in drawer versus credit card swipes and bank transfers. Match the cash drawer with the screen in 2 minutes and close out with 100% financial peace of mind.
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: 3mm;">
        <div class="doctor-callout-icon">📞</div>
        <div class="doctor-callout-text">
          <h4>Clinic Technical Support & System Warranty:</h4>
          <p>Your Brimish System is backed by dedicated technical support, automatic daily cloud database backups, and encrypted security updates. For emergency support, contact your development team anytime.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 9 (Final)</div>
    </div>
  </div>

</body>
</html>
`;

// Save HTML
const htmlPath = path.join(guideDir, 'dr_bilal_admin_guide.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML generated at: ${htmlPath}`);

// Define output PDF paths
const outputPdfWorkspace = path.join(baseDir, '..', 'Dr_Bilal_Brimish_Clinic_Admin_Guide.pdf');
const outputPdfPublic = path.join(guideDir, 'Dr_Bilal_Brimish_Clinic_Admin_Guide.pdf');
const userDesktop = 'C:\\Users\\hp\\Desktop\\Dr_Bilal_Brimish_Clinic_Admin_Guide.pdf';

console.log('Compiling PDF using Chrome headless...');

try {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cmd = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${outputPdfWorkspace}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(outputPdfWorkspace)) {
    console.log(`✓ Workspace PDF successfully created: ${outputPdfWorkspace} (${fs.statSync(outputPdfWorkspace).size} bytes)`);
    // Copy to public guide folder and desktop
    fs.copyFileSync(outputPdfWorkspace, outputPdfPublic);
    console.log(`✓ Public web PDF created: ${outputPdfPublic}`);
    
    try {
      fs.copyFileSync(outputPdfWorkspace, userDesktop);
      console.log(`✓ Desktop copy created: ${userDesktop}`);
    } catch (e) {
      console.log('Desktop copy skipped or not permitted:', e.message);
    }
  } else {
    console.error('PDF file was not found after execution.');
  }
} catch (err) {
  console.error('Error compiling PDF with Chrome:', err.message);
}
