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

  try {
    await qz.websocket.connect({
      retries: 1,
      delay: 0,
      usingSecure: isHttps,
    });
  } catch (err) {
    if (!isHttps) {
      // In HTTP mode, explicitly try insecure port 8182 if first attempt failed
      await qz.websocket.connect({
        retries: 1,
        delay: 0,
        usingSecure: false,
      });
    } else {
      throw err;
    }
  }

  return qz;
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

/**
 * Extracts element HTML, resolves relative image paths to base64 Data URLs or absolute URLs,
 * and wraps in thermal-optimized 48mm CSS for the SPEED X BT-500M printer.
 */
function prepareThermalHtml(element: HTMLElement, title: string = 'Receipt'): string {
  // Clone element to avoid touching the on-screen DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Process images: ensure relative paths like /images/logo.png are inlined as base64 or absolute
  const originalImgs = element.querySelectorAll<HTMLImageElement>('img');
  const cloneImgs = clone.querySelectorAll<HTMLImageElement>('img');

  for (let i = 0; i < cloneImgs.length; i++) {
    const orig = originalImgs[i];
    const target = cloneImgs[i];
    if (!target) continue;

    // If already base64 (like the QR verification code), keep intact
    if (target.src.startsWith('data:')) {
      continue;
    }

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @page {
      size: 48mm auto;
      margin: 0;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 48mm !important;
      max-width: 48mm !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      font-size: 9.5px !important;
      line-height: 1.25 !important;
    }
    .thermal-receipt-container {
      width: 48mm !important;
      max-width: 48mm !important;
      padding: 1.5mm 0.5mm 4mm 0.5mm !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      color: #000000 !important;
      word-break: break-word !important;
    }
    .thermal-receipt-container * {
      color: #000000 !important;
      text-shadow: none !important;
    }
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
    .thermal-receipt-container .border-b { border-bottom: 1px dashed #000000 !important; }
    .thermal-receipt-container .border-t { border-top: 1px solid #000000 !important; }
    .thermal-receipt-container .border { border: 1px solid #000000 !important; }
    .thermal-receipt-container .border-dashed { border-style: dashed !important; }
    .thermal-receipt-container img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      margin-left: auto !important;
      margin-right: auto !important;
      filter: grayscale(100%) contrast(160%) !important;
      image-rendering: -webkit-optimize-contrast !important;
    }
    /* Prevent solid dark rectangles on badges in print */
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
}

export interface PrintQzOptions {
  printerName?: string;
  paperWidth?: '58mm' | '80mm';
  title?: string;
}

/**
 * Prints an HTML element directly to the Windows thermal printer via QZ Tray.
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

  try {
    const qz = await connectQz();
    const targetPrinter = options?.printerName || 'POS-58 11.3.0.0';
    const printer = await findPosPrinter(targetPrinter);

    // 58mm paper: 48mm printable head width. 80mm paper: 72mm printable width.
    const is58mm = options?.paperWidth !== '80mm';
    const printWidthMm = is58mm ? 48 : 72;

    const config = qz.configs.create(printer, {
      rasterize: true,         // Required for POS-58 Windows GDI spooler
      size: { width: printWidthMm },
      units: 'mm',
      margins: 0,
      scaleContent: true,
      colorType: 'grayscale',
      interpolation: 'nearest-neighbor',
    });

    const thermalHtml = prepareThermalHtml(element, options?.title || 'Receipt');

    await qz.print(config, [
      {
        type: 'pixel',
        format: 'html',
        flavor: 'plain',
        data: thermalHtml,
      },
    ]);

    return { success: true, printer };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
