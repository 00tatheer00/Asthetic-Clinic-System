'use client';

/**
 * QZ Tray Integration Service for Brimish Skin Care POS
 * Connects directly to local QZ Tray (WebSocket) to stream rasterized 58mm thermal
 * receipts directly to the "POS-58 11.3.0.0" (SPEED X BT-500M) receipt printer.
 */

import type { QzTrayStatic } from 'qz-tray';

let qzInstance: QzTrayStatic | null = null;

/**
 * Dynamically imports qz-tray on client-side only.
 * Avoids any server-side rendering or build issues in Next.js.
 */
export async function getQz(): Promise<QzTrayStatic> {
  if (typeof window === 'undefined') {
    throw new Error('QZ Tray is only supported in browser environments');
  }

  if (!qzInstance) {
    const mod = await import('qz-tray');
    // Support commonjs / esm default export variants
    const resolved = (mod && (mod.default || mod)) as unknown as QzTrayStatic;
    if (!resolved || !resolved.websocket) {
      throw new Error('Failed to resolve QZ Tray client module');
    }
    qzInstance = resolved;
  }

  return qzInstance;
}

/**
 * Safely connects to local QZ Tray WebSocket.
 * Reuses active connection if already connected.
 */
export async function connectQz(): Promise<QzTrayStatic> {
  const qz = await getQz();

  if (qz.websocket.isActive()) {
    return qz;
  }

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // 1. Primary: Use QZ Tray's built-in multi-host/multi-port auto-negotiator
  // Scans localhost, localhost.qz.io, and 127.0.0.1 across ports 8182/8282/8382/8482 (or 8181 for HTTP)
  try {
    await qz.websocket.connect({
      usingSecure: isHttps,
      retries: 1,
      delay: 0.5,
      keepAlive: 60,
    });
    if (qz.websocket.isActive()) {
      return qz;
    }
  } catch (err) {
    console.warn('[QZ Tray] Primary auto-connect failed, trying specific hosts...', err);
  }

  // 2. Fallback attempts: test localhost.qz.io (valid SSL for HTTPS) and localhost
  const fallbackHosts = isHttps
    ? ['localhost.qz.io', 'localhost', '127.0.0.1']
    : ['localhost', '127.0.0.1', 'localhost.qz.io'];

  let lastError: unknown = null;
  for (const host of fallbackHosts) {
    try {
      await qz.websocket.connect({
        host,
        usingSecure: isHttps,
        retries: 0,
        delay: 0,
      });
      if (qz.websocket.isActive()) {
        return qz;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[QZ Tray] Connection to ${host} failed:`, err);
    }
  }

  const errorDetail =
    lastError instanceof Error
      ? lastError.message
      : 'Unable to connect to local QZ Tray WebSocket bridge.';

  throw new Error(
    `${errorDetail}. Please ensure QZ Tray is running on this PC. If running HTTPS, ensure Chrome allows Local Network Access or visit https://localhost.qz.io:8182 once to trust the certificate.`
  );
}

/**
 * Finds the target Windows thermal printer.
 * Prioritizes exact printer name "POS-58 11.3.0.0", then fuzzy matches (POS-58, BT-500, etc.),
 * and finally falls back to the default Windows printer.
 */
export async function findPosPrinter(preferredName: string = 'POS-58 11.3.0.0'): Promise<string> {
  const qz = await connectQz();

  // 1. Exact match attempt
  if (preferredName) {
    try {
      const match = await qz.printers.find(preferredName);
      if (typeof match === 'string' && match.trim()) {
        return match;
      }
      if (Array.isArray(match) && match.length > 0) {
        return match[0];
      }
    } catch {
      // Exact lookup threw (printer not found under exact name), try fuzzy search
    }
  }

  // 2. Fuzzy lookup among all installed Windows printers
  try {
    const allPrintersResult = await qz.printers.find();
    const printers: string[] = Array.isArray(allPrintersResult)
      ? allPrintersResult
      : typeof allPrintersResult === 'string'
      ? [allPrintersResult]
      : [];

    const searchPatterns = [
      /POS[-_ ]?58/i,
      /BT[-_ ]?500/i,
      /SPEED[-_ ]?X/i,
      /\b58\b/i,
      /thermal/i,
    ];

    for (const pattern of searchPatterns) {
      const found = printers.find((p) => pattern.test(p));
      if (found) {
        console.info(`[QZ Tray] Found matching printer: "${found}"`);
        return found;
      }
    }
  } catch (err) {
    console.warn('[QZ Tray] Could not list all printers:', err);
  }

  // 3. Fallback to Windows default printer
  try {
    const defaultPrinter = await qz.printers.getDefault();
    if (defaultPrinter) {
      console.info(`[QZ Tray] Using Windows default printer: "${defaultPrinter}"`);
      return defaultPrinter;
    }
  } catch (err) {
    console.warn('[QZ Tray] Could not query default printer:', err);
  }

  throw new Error(`Thermal printer "${preferredName}" not found and no suitable fallback printer detected.`);
}

/**
 * Checks whether QZ Tray is actively running and reachable on localhost.
 */
export async function isQzTrayAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const qz = await connectQz();
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}


let cachedThermalLogoBase64: string | null = null;

/**
 * Fetches and caches the pure black/white thermal logo as a base64 Data URL.
 * Guarantees zero network latency or external URL fetch failures in QZ Tray's WebEngine.
 */
async function getThermalLogoBase64(): Promise<string | null> {
  if (cachedThermalLogoBase64) return cachedThermalLogoBase64;
  if (typeof window === 'undefined') return null;

  try {
    const res = await fetch('/images/logo-thermal.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        cachedThermalLogoBase64 = result;
        resolve(result);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Extracts element HTML, inlines thermal logo and QR codes as Data URLs,
 * and wraps in thermal-optimized 48mm CSS for the SPEED X BT-500M printer.
 * Calculates exact physical receipt height to prevent continuous roll feeds.
 */
async function prepareThermalHtml(
  element: HTMLElement,
  title: string = 'Receipt',
  printWidthMm: number = 48
): Promise<{ html: string; heightMm: number }> {
  // 1. Calculate physical height of the rendered receipt
  const scrollHeight = element.scrollHeight;
  const offsetHeight = element.offsetHeight;
  const clientHeight = element.clientHeight;
  const rect = element.getBoundingClientRect();
  const measuredHeightPx = Math.max(scrollHeight, offsetHeight, clientHeight, Math.ceil(rect.height), 320);

  // 1 CSS px (96 DPI) = 0.264583 mm. Add 8mm bottom tear-off space for the cutter
  const heightMm = Math.max(65, Math.ceil((measuredHeightPx / 96) * 25.4) + 8);

  // 2. Clone element to avoid modifying the on-screen POS preview
  const clone = element.cloneNode(true) as HTMLElement;

  // 3. Process images: inline logo-thermal.png and preserve QR code base64
  const thermalLogoDataUrl = await getThermalLogoBase64();
  const originalImgs = element.querySelectorAll<HTMLImageElement>('img');
  const cloneImgs = clone.querySelectorAll<HTMLImageElement>('img');

  for (let i = 0; i < cloneImgs.length; i++) {
    const orig = originalImgs[i];
    const target = cloneImgs[i];
    if (!target) continue;

    const isLogo =
      target.src.includes('logo') ||
      target.alt.toLowerCase().includes('logo') ||
      (orig && orig.alt && orig.alt.toLowerCase().includes('logo'));

    if (isLogo && thermalLogoDataUrl) {
      target.src = thermalLogoDataUrl;
      continue;
    }

    // If already base64 (e.g. dynamic verification QR code), keep intact
    if (target.src.startsWith('data:')) {
      continue;
    }

    // Canvas snapshot fallback for other images
    try {
      if (orig && orig.complete && orig.naturalWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = orig.naturalWidth;
        canvas.height = orig.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(orig, 0, 0);
          target.src = canvas.toDataURL('image/png');
        }
      } else if (target.src.startsWith('/')) {
        target.src = `${window.location.origin}${target.src}`;
      }
    } catch {
      if (target.src.startsWith('/')) {
        target.src = `${window.location.origin}${target.src}`;
      }
    }
  }

  const innerContent = clone.innerHTML;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @page {
      size: ${printWidthMm}mm ${heightMm}mm;
      margin: 0;
    }
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${printWidthMm}mm !important;
      max-width: ${printWidthMm}mm !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Consolas, 'Lucida Console', monospace !important;
      font-size: 10px !important;
      line-height: 1.25 !important;
    }
    .thermal-receipt-container {
      width: ${printWidthMm}mm !important;
      max-width: ${printWidthMm}mm !important;
      padding: 0 1mm 2mm 1mm !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      color: #000000 !important;
      word-break: break-word !important;
    }
    .thermal-receipt-container * {
      color: #000000 !important;
      border-color: #000000 !important;
      text-shadow: none !important;
    }

    /* Flex utilities */
    .thermal-receipt-container .flex { display: flex !important; }
    .thermal-receipt-container .justify-between { justify-content: space-between !important; }
    .thermal-receipt-container .justify-center { justify-content: center !important; }
    .thermal-receipt-container .items-center { align-items: center !important; }
    .thermal-receipt-container .text-center { text-align: center !important; }
    .thermal-receipt-container .text-right { text-align: right !important; }
    .thermal-receipt-container .uppercase { text-transform: uppercase !important; }
    .thermal-receipt-container .font-bold { font-weight: 700 !important; }
    .thermal-receipt-container .font-black { font-weight: 900 !important; }
    .thermal-receipt-container .font-semibold { font-weight: 600 !important; }
    .thermal-receipt-container .block { display: block !important; }
    .thermal-receipt-container .w-full { width: 100% !important; }
    .thermal-receipt-container .w-1\\/2 { width: 50% !important; }
    .thermal-receipt-container .w-1\\/4 { width: 25% !important; }
    .thermal-receipt-container .mx-auto { margin-left: auto !important; margin-right: auto !important; }

    /* Spacing utilities */
    .thermal-receipt-container .space-y-0\\.5 > * + * { margin-top: 2px !important; }
    .thermal-receipt-container .space-y-1 > * + * { margin-top: 4px !important; }
    .thermal-receipt-container .space-y-1\\.5 > * + * { margin-top: 6px !important; }
    .thermal-receipt-container .space-y-2 > * + * { margin-top: 8px !important; }
    .thermal-receipt-container .mb-1\\.5 { margin-bottom: 4px !important; }
    .thermal-receipt-container .mt-0\\.5 { margin-top: 2px !important; }
    .thermal-receipt-container .mt-1 { margin-top: 3px !important; }
    .thermal-receipt-container .pt-0\\.5 { padding-top: 2px !important; }
    .thermal-receipt-container .pt-1 { padding-top: 3px !important; }
    .thermal-receipt-container .pt-1\\.5 { padding-top: 4px !important; }
    .thermal-receipt-container .pt-2 { padding-top: 5px !important; }
    .thermal-receipt-container .pt-2\\.5 { padding-top: 6px !important; }
    .thermal-receipt-container .pb-1 { padding-bottom: 3px !important; }
    .thermal-receipt-container .pb-2\\.5 { padding-bottom: 6px !important; }
    .thermal-receipt-container .py-2 { padding-top: 4px !important; padding-bottom: 4px !important; }

    /* Typography utilities */
    .thermal-receipt-container .text-\\[8px\\] { font-size: 8px !important; }
    .thermal-receipt-container .text-\\[9px\\] { font-size: 8.5px !important; }
    .thermal-receipt-container .text-\\[10px\\] { font-size: 9.5px !important; }
    .thermal-receipt-container .text-\\[11px\\] { font-size: 10px !important; }
    .thermal-receipt-container .text-xs { font-size: 10px !important; }
    .thermal-receipt-container .text-sm { font-size: 11px !important; }
    .thermal-receipt-container .tracking-tight { letter-spacing: -0.2px !important; }
    .thermal-receipt-container .tracking-wider { letter-spacing: 0.5px !important; }

    /* Borders */
    .thermal-receipt-container,
    .thermal-receipt-container * {
      border-left: none !important;
      border-right: none !important;
    }
    .thermal-receipt-container .border-b {
      border-bottom: 1px dashed #000000 !important;
      border-top: none !important;
      padding-bottom: 3px !important;
      margin-bottom: 3px !important;
    }
    .thermal-receipt-container .border-t {
      border-top: 1px solid #000000 !important;
      border-bottom: none !important;
      padding-top: 3px !important;
      margin-top: 3px !important;
    }
    .thermal-receipt-container .border-dashed {
      border-style: dashed !important;
    }

    /* Images */
    .thermal-receipt-container img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 0 auto !important;
      filter: none !important;
      -webkit-filter: none !important;
      image-rendering: pixelated !important;
    }
    .thermal-receipt-container img[src*="logo"],
    .thermal-receipt-container .w-11 {
      width: 38px !important;
      height: 38px !important;
      object-fit: contain !important;
    }
    .thermal-receipt-container img[src*="data:image"],
    .thermal-receipt-container .w-24 img {
      width: 72px !important;
      height: 72px !important;
      background: #ffffff !important;
      margin: 0 auto !important;
      display: block !important;
    }

    /* Badges */
    .thermal-receipt-container .bg-black,
    .thermal-receipt-container [class*="bg-black"],
    .thermal-receipt-container [class*="bg-stone-900"],
    .thermal-receipt-container [class*="bg-gray-900"] {
      background-color: transparent !important;
      background: transparent !important;
      color: #000000 !important;
      border: 1px solid #000000 !important;
    }
  </style>
</head>
<body>
  <div class="thermal-receipt-container">
    ${innerContent}
  </div>
</body>
</html>`;

  return { html, heightMm };
}

export interface PrintQzOptions {
  printerName?: string;
  paperWidth?: '58mm' | '80mm';
  title?: string;
}

/**
 * Prints an HTML element directly to the Windows thermal printer via QZ Tray.
 * Calculates exact physical receipt height to avoid continuous blank paper roll feeds.
 * Returns { success: true, printer } on success, or { success: false, error } on failure.
 */
export async function printElementWithQz(
  elementId: string,
  options?: PrintQzOptions
): Promise<{ success: boolean; printer?: string; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot print in non-browser environment' };
  }

  const element = document.getElementById(elementId);
  if (!element) {
    return { success: false, error: `Receipt element with ID "${elementId}" not found in DOM` };
  }

  // Ensure receipt is not an empty container
  const textContent = element.innerText || element.textContent || '';
  if (textContent.trim().length < 10) {
    return { success: false, error: 'Receipt content is empty' };
  }

  try {
    const qz = await connectQz();
    const targetPrinter = options?.printerName || 'POS-58 11.3.0.0';
    const printer = await findPosPrinter(targetPrinter);

    // 58mm roll: 48mm printable head width. 80mm roll: 72mm printable width.
    const is58mm = options?.paperWidth !== '80mm';
    const printWidthMm = is58mm ? 48 : 72;

    // Prepare HTML and calculate exact physical height
    const { html: thermalHtml, heightMm } = await prepareThermalHtml(
      element,
      options?.title || 'Receipt',
      printWidthMm
    );

    // Explicit dimensions (width & height) are REQUIRED for thermal continuous rolls
    // to prevent infinite 0-height pagination loops that feed blank paper continuously.
    const config = qz.configs.create(printer, {
      size: { width: printWidthMm, height: heightMm },
      units: 'mm',
      margins: 0,
      scaleContent: false, // 1:1 crisp rendering, do not scale!
      colorType: 'color',  // Render full contrast in JavaFX WebKit
      rasterize: false,    // Use native vector/GDI text rendering on Windows POS-58
      interpolation: 'nearest-neighbor',
    });

    await qz.print(config, [
      {
        type: 'pixel',
        format: 'html',
        flavor: 'plain',
        data: thermalHtml,
        options: {
          pageWidth: printWidthMm,
          pageHeight: heightMm,
        },
      },
    ]);

    return { success: true, printer };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
