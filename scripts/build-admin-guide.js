const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const baseDir = path.resolve(__dirname, '..');
const publicDir = path.join(baseDir, 'public');
const guideDir = path.join(publicDir, 'guide');

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
  return '';
}

const logoBase64 = getBase64Image(path.join(publicDir, 'images', 'logo.png'));
const drBilalBase64 = getBase64Image(path.join(publicDir, 'images', 'dr-bilal.jpg'));
const dashboardMockup = getBase64Image(path.join(guideDir, 'dashboard_overview.jpg'));
const posMockup = getBase64Image(path.join(guideDir, 'pos_orders.jpg'));
const appointmentsMockup = getBase64Image(path.join(guideDir, 'appointments_emr.jpg'));

console.log('Images loaded into Base64 memory successfully.');

// Construct High-End Executive HTML
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
      line-height: 1.5;
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
      height: 20mm;
      padding: 0 18mm;
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
      height: 32px;
      width: auto;
      object-fit: contain;
    }
    .header-clinic-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-tagline {
      font-size: 10px;
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
      padding: 5px 12px;
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
      height: 14mm;
      padding: 0 18mm;
      background: #FAF7F5;
      border-top: 1.5px solid var(--border-soft);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: var(--text-muted);
      flex-shrink: 0;
      margin-top: auto;
    }
    .footer-left {
      font-weight: 600;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
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
      padding: 7mm 18mm 7mm 18mm;
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
      margin-bottom: 5mm;
      position: relative;
    }
    .module-category {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gold-dark);
      background: var(--gold-light);
      padding: 3px 10px;
      border-radius: 4px;
      margin-bottom: 4px;
      border: 1px solid var(--gold-border);
    }
    .page-main-heading {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.2;
    }
    .page-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 3px;
      line-height: 1.4;
    }

    /* Mockup Frame */
    .mockup-container {
      background: #FFFFFF;
      border-radius: 10px;
      border: 1.5px solid #E2D9D2;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(45, 18, 38, 0.08);
      margin-bottom: 5mm;
      position: relative;
    }
    .mockup-bar {
      height: 24px;
      background: #F4EFEB;
      border-bottom: 1px solid #E2D9D2;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 6px;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }
    .dot.red { background: #FF5F56; }
    .dot.yellow { background: #FFBD2E; }
    .dot.green { background: #27C93F; }
    .mockup-title {
      font-size: 10px;
      color: #786C66;
      font-weight: 600;
      margin-left: 8px;
    }
    .mockup-img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    /* Cards & Grids */
    .card-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 4mm;
    }
    .card-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 4mm;
    }
    .card-grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 4mm;
    }
    .info-card {
      background: var(--bg-soft);
      border: 1px solid var(--border-soft);
      border-radius: 8px;
      padding: 10px 12px;
      position: relative;
    }
    .info-card.gold-card {
      background: #FFFDF9;
      border: 1px solid var(--gold-border);
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.08);
    }
    .info-card.primary-card {
      background: #FDF9FB;
      border: 1px solid #ECC9DF;
    }
    .card-header-flex {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
    }
    .card-icon {
      font-size: 16px;
      line-height: 1;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
    }
    .card-body {
      font-size: 11px;
      color: var(--text-dark);
      line-height: 1.45;
    }

    /* Action List */
    .action-steps {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #FFFFFF;
      border: 1px solid #ECE4DF;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .step-num {
      width: 22px;
      height: 22px;
      background: var(--primary);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-content h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 2px;
    }
    .step-content p {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 12px;
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
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: auto;
      border-left: 4px solid var(--gold);
    }
    .doctor-callout-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .doctor-callout-text h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 800;
      color: var(--gold-light);
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doctor-callout-text p {
      font-size: 11px;
      color: #F8E7F3;
      line-height: 1.4;
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
      margin-bottom: 12mm;
    }
    .cover-logo-img {
      height: 60px;
      width: auto;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
    }
    .cover-clinic-titles h3 {
      font-size: 20px;
      color: #FFFFFF;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .cover-clinic-titles p {
      font-size: 11px;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cover-badge-row {
      margin-bottom: 6mm;
    }
    .cover-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gold);
      border: 1px solid var(--gold);
      padding: 6px 14px;
      border-radius: 30px;
      background: rgba(212, 175, 55, 0.1);
    }
    .cover-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.15;
      color: #FFFFFF;
      margin-bottom: 5mm;
      text-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .cover-title span {
      color: var(--gold);
      font-style: italic;
    }
    .cover-lead {
      font-size: 15px;
      color: #E2CFDD;
      max-width: 150mm;
      line-height: 1.6;
      margin-bottom: 8mm;
      font-weight: 400;
    }

    .cover-features-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-width: 160mm;
      margin-bottom: 10mm;
    }
    .cover-pill {
      font-size: 11px;
      font-weight: 600;
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 6px 12px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .cover-doctor-card {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.06);
      border: 1.5px solid rgba(212, 175, 55, 0.4);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .cover-doctor-photo {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      border: 3px solid var(--gold);
      object-fit: cover;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .cover-doctor-info h4 {
      font-size: 18px;
      color: #FFFFFF;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .cover-doctor-info .doc-role {
      font-size: 12px;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .cover-doctor-info .doc-desc {
      font-size: 11px;
      color: #D3BED0;
      line-height: 1.4;
    }
    .cover-bottom-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8mm;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 11px;
      color: #A38CA0;
      position: relative;
      z-index: 2;
    }

    /* Page 2 - Overview & Architecture */
    .pillars-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 4mm;
    }
    .pillar-card {
      background: #FFFFFF;
      border: 1px solid #EBE2DC;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .pillar-num {
      width: 26px;
      height: 26px;
      background: var(--gold-light);
      border: 1px solid var(--gold-border);
      color: var(--gold-dark);
      font-weight: 800;
      font-size: 12px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pillar-text h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 2px;
    }
    .pillar-text p {
      font-size: 10.5px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Cheat Sheet Table */
    .cheat-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5mm;
      font-size: 11px;
    }
    .cheat-table th {
      background: var(--primary);
      color: #FFFFFF;
      padding: 8px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
    }
    .cheat-table th:first-child { border-top-left-radius: 6px; }
    .cheat-table th:last-child { border-top-right-radius: 6px; }
    .cheat-table td {
      padding: 8px 12px;
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
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4mm;
    }
    .cred-item {
      display: flex;
      flex-direction: column;
    }
    .cred-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .cred-val {
      font-size: 13px;
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
        <span class="cover-tag">EXECUTIVE CLINIC MANUAL • 2026 EDITION</span>
      </div>

      <h1 class="cover-title">
        Doctor Bilal’s Complete<br>
        <span>Admin Panel Guide</span>
      </h1>

      <p class="cover-lead">
        A visual, step-by-step master handbook written in simple English. Learn how to control your entire clinic, book appointments, bill walk-in patients, manage online skincare orders, track medical records, and monitor live revenue with zero technical headache.
      </p>

      <div class="cover-features-pills">
        <span class="cover-pill">✓ Live Daily Revenue & Analytics</span>
        <span class="cover-pill">✓ Smart Patient Appointments & Rooms</span>
        <span class="cover-pill">✓ High-Speed POS Counter & Thermal Slips</span>
        <span class="cover-pill">✓ Online Skincare Store Order Dispatch</span>
        <span class="cover-pill">✓ Digital EMR Medical Records & History</span>
        <span class="cover-pill">✓ Real-Time Stock & Inventory Alerts</span>
      </div>
    </div>

    <!-- Doctor Profile Bar -->
    <div class="cover-doctor-card">
      <img class="cover-doctor-photo" src="${drBilalBase64}" alt="Dr. Bilal Ahmad">
      <div class="cover-doctor-info">
        <h4>Dr. Bilal Ahmad</h4>
        <div class="doc-role">MD Aesthetic Medicine & Clinic Director</div>
        <div class="doc-desc">Medical Director at Brimish Skin Care Clinic. Specialist in Advanced Medical Facials, Laser Resurfacing, Botox, Fillers & Clinical Skin Health.</div>
      </div>
    </div>

    <div class="cover-bottom-meta">
      <div>📍 <strong>Location:</strong> Bahria Town Phase 7, Rawalpindi / Islamabad</div>
      <div>⚡ <strong>System Version:</strong> Brimish Pro v2.4 (Active Cloud)</div>
      <div>🔒 <strong>Confidential:</strong> Doctor & Executive Staff Eyes Only</div>
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
            Whether you are inside the clinic, traveling, or at home, open your phone or laptop to see live patient visits, earnings, and appointments instantly.
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

      <h3 style="font-size: 15px; margin-bottom: 2mm; color: var(--primary);">The 8 Core Superpowers in Your Admin Panel:</h3>

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

      <div class="doctor-callout" style="margin-top: 4mm;">
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

  <!-- ==================== PAGE 3: LIVE DASHBOARD & ANALYTICS ==================== -->
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
        <p class="page-subtitle">The first screen you see every morning. It summarizes financial health, patient traffic, and pending clinic tasks in real-time.</p>
      </div>

      <!-- Screenshot Mockup -->
      <div class="mockup-container">
        <div class="mockup-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="mockup-title">Brimish Executive Clinic Dashboard — https://brimish-skincare.com/dashboard</span>
        </div>
        <img class="mockup-img" src="${dashboardMockup}" alt="Executive Dashboard Screen Mockup">
      </div>

      <!-- What Dr. Bilal Can See & Do -->
      <div class="card-grid-2">
        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">💰</span>
            <div class="card-title">Live Revenue & Patient Counter</div>
          </div>
          <div class="card-body">
            <strong>Today's Total Gross Revenue:</strong> Instantly updates every time a bill is paid at reception or an online order is confirmed.<br>
            <strong>Patient Visits:</strong> See exact numbers of walk-ins, scheduled consultations, and completed aesthetic procedures today.
          </div>
        </div>

        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">🔔</span>
            <div class="card-title">4-Tab Instant Notification Bell</div>
          </div>
          <div class="card-body">
            Your top-right notification center is organized into 4 crystal-clear tabs:<br>
            <strong>1. Bookings:</strong> New patient requests needing confirmation.<br>
            <strong>2. Orders:</strong> Website skincare purchases to pack.<br>
            <strong>3. Low Stock:</strong> Serums & consumables running out.<br>
            <strong>4. Reviews:</strong> New 5-star patient reviews on your website.
          </div>
        </div>
      </div>

      <div class="card-grid-2">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📊</span>
            <div class="card-title">7-Day Financial Performance Graph</div>
          </div>
          <div class="card-body">
            Track daily revenue peaks, weekends vs. weekdays, and analyze whether in-clinic procedures (e.g. HydraFacial, Lasers) or skincare product sales are driving your highest profit margins.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">⭐</span>
            <div class="card-title">Top Performing Aesthetic Treatments</div>
          </div>
          <div class="card-body">
            See your most popular procedures ranked by revenue (e.g. Carbon Laser Peel, Microneedling, Glutathione Glow Therapy) so you know which treatments patients love most.
          </div>
        </div>
      </div>

      <div class="doctor-callout">
        <div class="doctor-callout-icon">📱</div>
        <div class="doctor-callout-text">
          <h4>Mobile & Tablet Ready for Doctor Bilal:</h4>
          <p>You can open this dashboard on your iPhone, iPad, or Android phone while consulting. No app download needed — just visit your clinic URL and log in securely.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="footer-left">Confidential • For Dr. Bilal Ahmad & Authorized Executive Clinic Staff Only</div>
      <div class="footer-right">Brimish Clinic Admin Manual • Page 3</div>
    </div>
  </div>

  <!-- ==================== PAGE 4: APPOINTMENTS & CALENDAR ==================== -->
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
        <p class="page-subtitle">Manage online patient bookings, phone reservations, and treatment room assignments with 1-click status updates.</p>
      </div>

      <!-- Screenshot Mockup -->
      <div class="mockup-container">
        <div class="mockup-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="mockup-title">Brimish Appointment Roster & EMR — https://brimish-skincare.com/dashboard/appointments</span>
        </div>
        <img class="mockup-img" src="${appointmentsMockup}" alt="Appointments and EMR Screen Mockup">
      </div>

      <!-- How It Works in 4 Steps -->
      <h3 style="font-size: 14px; margin-bottom: 2mm; color: var(--primary);">How an Appointment Moves Through Your Clinic:</h3>

      <div class="action-steps">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-content">
            <h4>Patient Books Online or Calls Reception <span class="badge badge-warning">Pending</span></h4>
            <p>Patient selects their desired treatment (e.g. Laser Skin Resurfacing) and time slot on your website. It appears instantly on your screen with a notification badge.</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-content">
            <h4>One-Click Confirmation & Room Assignment <span class="badge badge-primary">Confirmed</span></h4>
            <p>Click <strong>"Confirm"</strong>. The system assigns Treatment Room 1 or Laser Suite and sends an automated WhatsApp/SMS booking reminder to the patient.</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-content">
            <h4>Patient Arrives at Clinic <span class="badge badge-blue">In-Session</span></h4>
            <p>Receptionist marks patient as <strong>"In-Session"</strong>. Dr. Bilal sees on his screen that the patient is in the consultation room ready for treatment.</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">4</div>
          <div class="step-content">
            <h4>Treatment Finished & Auto-Billed <span class="badge badge-success">Completed</span></h4>
            <p>Once procedure is done, status changes to <strong>"Completed"</strong>. The invoice automatically sends to the POS desk for instant checkout and receipt printing.</p>
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

  <!-- ==================== PAGE 5: PATIENT DIGITAL EMR & CLINICAL NOTES ==================== -->
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
        <p class="page-subtitle">Every patient’s aesthetic history, laser session logs, allergy alerts, and prescription notes securely stored in one place.</p>
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

      <h3 style="font-size: 14px; margin-bottom: 2mm; color: var(--primary);">What Dr. Bilal Can Record in Each Patient Profile:</h3>

      <div class="card-grid-3">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📝</span>
            <div class="card-title">Doctor's Clinical Notes</div>
          </div>
          <div class="card-body">
            Write confidential medical observations during consultation: e.g. <em>"Patient presents with melasma on cheeks. Prescribed 20% Azelaic Acid + HydraFacial Session 1."</em>
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">🔢</span>
            <div class="card-title">Multi-Session Tracker</div>
          </div>
          <div class="card-body">
            Track packages effortlessly: e.g., <strong>Laser Hair Removal Session 3 of 6</strong>. The system records laser joules, pulse duration, and spot size used.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📸</span>
            <div class="card-title">Before & After Records</div>
          </div>
          <div class="card-body">
            Attach high-resolution consultation photos (Day 1 vs. Day 30) directly to the patient's private profile to show their skin transformation.
          </div>
        </div>
      </div>

      <div class="card-grid-2" style="margin-top: 2mm;">
        <div class="info-card" style="background: #F8FAFC; border: 1px solid #CBD5E1;">
          <div class="card-header-flex">
            <span class="card-icon">💊</span>
            <div class="card-title">Post-Care Instructions & Home Regimen</div>
          </div>
          <div class="card-body">
            Add recommended take-home skincare (e.g. Brimish Vitamin C Serum + Mineral Sunscreen SPF 50). Receptionist can add them to the patient’s bill with 1 click.
          </div>
        </div>

        <div class="info-card" style="background: #F8FAFC; border: 1px solid #CBD5E1;">
          <div class="card-header-flex">
            <span class="card-icon">🔒</span>
            <div class="card-title">Confidential HIPAA & Medical Privacy</div>
          </div>
          <div class="card-body">
            Patient clinical notes are only visible to Dr. Bilal and authorized medical staff. Receptionists only see billing and appointment scheduling details.
          </div>
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: 4mm;">
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

  <!-- ==================== PAGE 6: POS BILLING & THERMAL PRINT SLIPS ==================== -->
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
        <p class="page-subtitle">Bill walk-in patients and sell skincare products at the reception desk in less than 30 seconds with automatic tax and discount calculation.</p>
      </div>

      <!-- Screenshot Mockup -->
      <div class="mockup-container">
        <div class="mockup-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="mockup-title">Brimish POS & Order Fulfillment — https://brimish-skincare.com/dashboard/pos</span>
        </div>
        <img class="mockup-img" src="${posMockup}" alt="POS Terminal and Skincare Orders Screen Mockup">
      </div>

      <div class="card-grid-2">
        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">⚡</span>
            <div class="card-title">Touchscreen Counter Billing</div>
          </div>
          <div class="card-body">
            One-touch category tabs for <strong>Treatments</strong> (HydraFacial, Peels, Lasers) and <strong>Skincare Products</strong> (Serums, Sunscreens, Cleansers). Tap to add directly to cart.
          </div>
        </div>

        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">🔒</span>
            <div class="card-title">Mandatory Patient Verification</div>
          </div>
          <div class="card-body">
            <strong>Patient Full Name & WhatsApp Number are strictly required</strong> before printing. This ensures 100% of walk-in patients are saved to your clinic database forever.
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
            Apply percentage (e.g. 10% Eid Special) or flat PKR discount (e.g. Rs. 1,000 off). The bill recalculates subtotal, tax, and net payable automatically.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">💳</span>
            <div class="card-title">Multiple Payment Modes</div>
          </div>
          <div class="card-body">
            Accept Cash, Credit/Debit Card (POS machine), Direct Bank Transfer, or JazzCash / EasyPaisa. System records the exact payment method for daily reconciliation.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">🖨️</span>
            <div class="card-title">Instant Thermal Receipt</div>
          </div>
          <div class="card-body">
            Prints standard 80mm clinic receipt with logo, Doctor's name, itemized services, tax registration, and barcode. Features clean outlined badges (never messy).
          </div>
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: 3mm;">
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

  <!-- ==================== PAGE 7: ONLINE SKINCARE STORE & DISPATCH ==================== -->
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
        <p class="page-subtitle">Manage customer orders placed on your website from Lahore, Karachi, Islamabad, or anywhere in Pakistan with 1-click dispatch slips.</p>
      </div>

      <!-- Action Pipeline -->
      <h3 style="font-size: 14px; margin-bottom: 2mm; color: var(--primary);">Complete 4-Stage Order Fulfillment Pipeline:</h3>

      <div class="action-steps" style="margin-bottom: 4mm;">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-content">
            <h4>Customer Places Order Online <span class="badge badge-warning">Pending</span></h4>
            <p>Customer orders serums or creams on your website. Your notification bell chimes instantly with customer name, phone, delivery address, and items ordered.</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-content">
            <h4>Verification & Confirmation <span class="badge badge-primary">Confirmed</span></h4>
            <p>Click <strong>"Confirm"</strong> or tap the WhatsApp icon to message the customer. Stock is automatically reserved in your inventory so items never oversell.</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-content">
            <h4>Print Thermal Dispatch Slip & Pack <span class="badge badge-blue">Dispatched</span></h4>
            <p>Click <strong>"Print Dispatch Slip"</strong>. A high-clarity 80mm thermal shipping label prints instantly. Stick it on the courier flyer (TCS, Leopard, Trax, Call Courier).</p>
          </div>
        </div>

        <div class="step-item">
          <div class="step-num">4</div>
          <div class="step-content">
            <h4>Courier Delivers Cash-on-Delivery (COD) <span class="badge badge-success">Delivered</span></h4>
            <p>Mark order as <strong>"Delivered"</strong>. Money received is credited to your online store sales record and reflected in monthly profit statements.</p>
          </div>
        </div>
      </div>

      <!-- Features Cards -->
      <div class="card-grid-2">
        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">📦</span>
            <div class="card-title">Courier Thermal Label Printing</div>
          </div>
          <div class="card-body">
            You don't need expensive sticker machines! The system formats courier dispatch slips directly for your existing 80mm thermal printer with sender clinic details, recipient address, phone, COD amount, and tracking barcode.
          </div>
        </div>

        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">🔄</span>
            <div class="card-title">Instant Inventory Synchronization</div>
          </div>
          <div class="card-body">
            When a customer buys 2 bottles of Niacinamide Serum online, your clinic inventory automatically drops by 2. This prevents clinic reception and website from fighting over the same stock!
          </div>
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: auto;">
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

  <!-- ==================== PAGE 8: INVENTORY & WEBSITE MANAGEMENT ==================== -->
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
        <h2 class="page-main-heading">Inventory & Website: Complete Control Without Coding</h2>
        <p class="page-subtitle">Dr. Bilal can update treatment prices, add new skincare formulas, manage stock levels, and publish patient before/after results anytime.</p>
      </div>

      <div class="card-grid-2">
        <div class="info-card gold-card">
          <div class="card-header-flex">
            <span class="card-icon">🧪</span>
            <div class="card-title">Real-Time Stock & Consumables</div>
          </div>
          <div class="card-body">
            <strong>Stock Ledger:</strong> Track every item in clinic (HydraFacial serums, peel solutions, cannula needles, take-home retail products).<br>
            <strong>Low Stock Warning:</strong> Set minimum threshold (e.g. 5 units). When stock hits 4, the dashboard notifies you so you reorder before running dry!
          </div>
        </div>

        <div class="info-card primary-card">
          <div class="card-header-flex">
            <span class="card-icon">💉</span>
            <div class="card-title">Aesthetic Treatment Menu Control</div>
          </div>
          <div class="card-body">
            <strong>Price Updates:</strong> Change treatment prices in 5 seconds without hiring a web developer.<br>
            <strong>Service Details:</strong> Edit session duration, recommended sessions, downtime (e.g. "Zero Downtime"), and high-res treatment photos shown on the website.
          </div>
        </div>
      </div>

      <h3 style="font-size: 14px; margin-bottom: 2mm; color: var(--primary);">More Features Under Dr. Bilal's Full Control:</h3>

      <div class="card-grid-3">
        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">✨</span>
            <div class="card-title">Add New Skincare Products</div>
          </div>
          <div class="card-body">
            Upload new products to your online store with product name, price, ingredients list, how-to-use directions, skin type suitability, and bottle photos.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">📷</span>
            <div class="card-title">Before & After Gallery</div>
          </div>
          <div class="card-body">
            Upload genuine clinical results (Acne scars, Melasma, Skin tightening) to your website's public gallery to build trust and drive high-ticket bookings.
          </div>
        </div>

        <div class="info-card">
          <div class="card-header-flex">
            <span class="card-icon">⭐</span>
            <div class="card-title">Patient Reviews Moderation</div>
          </div>
          <div class="card-body">
            Approve and feature glowing 5-star patient reviews on your clinic homepage. Filter out spam or unverified comments with one click.
          </div>
        </div>
      </div>

      <div class="card-grid-2" style="margin-top: 2mm;">
        <div class="info-card" style="background: #FDFCFB; border: 1px solid #EBE4DD;">
          <div class="card-header-flex">
            <span class="card-icon">💰</span>
            <div class="card-title">Automated Tax & GST Invoicing</div>
          </div>
          <div class="card-body">
            Generates standardized tax invoices with official clinic NTN/STRN, doctor license number, patient details, and sequential invoice numbers (INV-2026-001).
          </div>
        </div>

        <div class="info-card" style="background: #FDFCFB; border: 1px solid #EBE4DD;">
          <div class="card-header-flex">
            <span class="card-icon">👥</span>
            <div class="card-title">Staff Role & Permission Control</div>
          </div>
          <div class="card-body">
            Assign staff roles: Receptionist (can book and bill), Inventory Manager (can update stock), Doctor (can view medical records and clinical notes).
          </div>
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: 4mm;">
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
            <td>Go to <strong>POS</strong> → Enter Patient Name & Phone → Click treatments/products → Click <em>"Print Thermal Receipt"</em></td>
            <td>80mm receipt prints instantly, cash is recorded, and stock drops.</td>
          </tr>
          <tr>
            <td><strong>Ship an Online Skincare Order</strong></td>
            <td>Go to <strong>Orders</strong> → Click <em>"Confirm"</em> → Click <em>"Print Slip"</em> → Paste on flyer</td>
            <td>Courier dispatch slip prints with customer address & COD.</td>
          </tr>
          <tr>
            <td><strong>View Patient Medical History & Past Notes</strong></td>
            <td>Go to <strong>Patients / EMR</strong> → Type patient mobile number in search bar → Click profile</td>
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
      <h3 style="font-size: 13px; margin-bottom: 2mm; color: var(--primary);">Dr. Bilal's Official Login Credentials & Access:</h3>

      <div class="credentials-box">
        <div class="cred-item">
          <span class="cred-label">Clinic Portal URL</span>
          <span class="cred-val">https://brimish-skincare.com/login</span>
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
      <div class="info-card primary-card" style="margin-top: 4mm;">
        <div class="card-header-flex">
          <span class="card-icon">🌙</span>
          <div class="card-title">Daily Evening Cash Reconciliation (2 Minutes)</div>
        </div>
        <div class="card-body">
          At 9:00 PM when clinic closes, Dr. Bilal or Head Receptionist clicks <strong>"Daily Closeout"</strong>. The system gives the exact cash collected in drawer, total credit card swipes, and total bank transfers. Match the cash drawer with the screen in 2 minutes and close out with 100% financial peace of mind.
        </div>
      </div>

      <div class="doctor-callout" style="margin-top: 4mm;">
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
