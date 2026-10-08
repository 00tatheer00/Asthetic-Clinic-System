'use client';

/**
 * Universal High-Reliability Receipt & Invoice Print Helper for Brimish Skin Care
 * Priority 1: Direct silent thermal printing via QZ Tray to "POS-58 11.3.0.0" (58mm thermal roll).
 * Priority 2 (Fallback): Isolated iframe printing via native browser dialog.
 */

import { toast } from 'sonner';
import { getReceiptSettings } from '@/lib/receipt-settings';
import { printElementWithQz } from '@/lib/qz-tray';

export interface PrintReceiptOptions {
  title?: string;
  isThermal?: boolean;
  skipQz?: boolean;
  printerName?: string;
}

let isPrintJobRunning = false;

/**
 * Fallback browser printing via isolated iframe
 */
export function executeIframePrint(elementId: string, options?: PrintReceiptOptions | string): boolean {
  if (typeof window === 'undefined') return false;

  const title = typeof options === 'string' ? options : options?.title || 'Brimish-Invoice-Receipt';
  const element = document.getElementById(elementId);

  if (!element) {
    console.warn(`Print element with id "${elementId}" not found. Falling back to window.print()`);
    window.print();
    return false;
  }

  // Set document title temporarily so "Save as PDF" uses the invoice number as the default filename
  const originalDocTitle = document.title;
  document.title = title;

  // Clean up any existing print iframe
  const existingFrame = document.getElementById('brimish-isolated-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create an isolated hidden iframe rendered off-screen at 48mm thermal width
  const iframe = document.createElement('iframe');
  iframe.id = 'brimish-isolated-print-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.top = '-99999px';
  iframe.style.left = '-99999px';
  iframe.style.width = '48mm';
  iframe.style.height = 'auto';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Could not access iframe document for printing. Falling back to native print.');
    window.print();
    document.title = originalDocTitle;
    return false;
  }

  // Extract clean HTML content and swap golden logo for crisp thermal silhouette
  const contentHtml = element.innerHTML.replace(/\/images\/logo\.png/g, '/images/logo-thermal.png');

  // Write standalone printable document — NO copiedStyles from main app (prevents flex centering and vertical gaps)
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    /* ======================================================== */
    /* STANDALONE 58MM THERMAL RECEIPT (ZERO TOP/BOTTOM GAPS)   */
    /* ======================================================== */
    @page {
      size: 58mm auto;
      margin: 0mm !important;
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 48mm !important;
      max-width: 48mm !important;
      height: auto !important;
      min-height: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      display: block !important;
      position: static !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      -webkit-font-smoothing: antialiased;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
    }

    .printable-receipt-wrapper {
      width: 48mm !important;
      max-width: 48mm !important;
      min-width: 48mm !important;
      margin: 0 !important;
      padding: 0 1mm 2mm 1mm !important;
      display: block !important;
      position: static !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: 9.5px !important;
      line-height: 1.25 !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    /* Force all nested wrapper containers to start immediately at top without any margins */
    .printable-receipt-wrapper #printable-invoice,
    .printable-receipt-wrapper [id*="printable"],
    .printable-receipt-wrapper > div {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    /* Typography & utility fallbacks */
    .printable-receipt-wrapper * {
      color: #000000 !important;
      text-shadow: none !important;
    }

    /* Clinic Header & Headings */
    .printable-receipt-wrapper h2 {
      font-size: 11px !important;
      font-weight: 900 !important;
      line-height: 1.2 !important;
      text-align: center !important;
      margin: 1px 0 !important;
      letter-spacing: -0.2px !important;
    }

    .printable-receipt-wrapper p {
      font-size: 8.5px !important;
      line-height: 1.2 !important;
      margin: 1px 0 !important;
      color: #000000 !important;
    }

    /* Spacing utilities for compact thermal receipt */
    .printable-receipt-wrapper .space-y-0\\.5 > * + * { margin-top: 1.5px !important; }
    .printable-receipt-wrapper .space-y-1 > * + * { margin-top: 2.5px !important; }
    .printable-receipt-wrapper .space-y-1\\.5 > * + * { margin-top: 3.5px !important; }
    .printable-receipt-wrapper .space-y-2 > * + * { margin-top: 5px !important; }
    .printable-receipt-wrapper .py-0\\.5 { padding-top: 1px !important; padding-bottom: 1px !important; }
    .printable-receipt-wrapper .py-1 { padding-top: 2px !important; padding-bottom: 2px !important; }
    .printable-receipt-wrapper .py-1\\.5 { padding-top: 3px !important; padding-bottom: 3px !important; }
    .printable-receipt-wrapper .py-2 { padding-top: 4px !important; padding-bottom: 4px !important; }
    .printable-receipt-wrapper .pb-1 { padding-bottom: 2px !important; }
    .printable-receipt-wrapper .pb-2 { padding-bottom: 4px !important; }
    .printable-receipt-wrapper .pb-2\\.5 { padding-bottom: 5px !important; }
    .printable-receipt-wrapper .pt-0\\.5 { padding-top: 1px !important; }
    .printable-receipt-wrapper .pt-1 { padding-top: 2px !important; }
    .printable-receipt-wrapper .pt-1\\.5 { padding-top: 3px !important; }
    .printable-receipt-wrapper .pt-2 { padding-top: 4px !important; }
    .printable-receipt-wrapper .pt-2\\.5 { padding-top: 5px !important; }
    .printable-receipt-wrapper .mb-1 { margin-bottom: 2px !important; }
    .printable-receipt-wrapper .mb-1\\.5 { margin-bottom: 3px !important; }
    .printable-receipt-wrapper .mt-0\\.5 { margin-top: 1px !important; }
    .printable-receipt-wrapper .mt-1 { margin-top: 2px !important; }

    /* Flex items & Table Rows */
    .printable-receipt-wrapper .flex {
      display: flex !important;
      width: 100% !important;
    }

    .printable-receipt-wrapper .justify-between {
      justify-content: space-between !important;
      gap: 2px !important;
    }

    .printable-receipt-wrapper .justify-center { justify-content: center !important; }
    .printable-receipt-wrapper .items-center { align-items: center !important; }
    .printable-receipt-wrapper .text-center { text-align: center !important; }
    .printable-receipt-wrapper .text-right { text-align: right !important; }
    .printable-receipt-wrapper .uppercase { text-transform: uppercase !important; }
    .printable-receipt-wrapper .font-bold { font-weight: 700 !important; }
    .printable-receipt-wrapper .font-black { font-weight: 900 !important; }
    .printable-receipt-wrapper .font-semibold { font-weight: 600 !important; }
    .printable-receipt-wrapper .block { display: block !important; }
    .printable-receipt-wrapper .w-full { width: 100% !important; }
    .printable-receipt-wrapper .w-1\\/2 { width: 48% !important; }
    .printable-receipt-wrapper .w-1\\/4 { width: 26% !important; }
    .printable-receipt-wrapper .mx-auto { margin-left: auto !important; margin-right: auto !important; }

    /* Fine-tune font sizes for 48mm thermal roll */
    .printable-receipt-wrapper .text-xs,
    .printable-receipt-wrapper .text-sm {
      font-size: 10px !important;
    }
    .printable-receipt-wrapper .text-\\[10px\\] {
      font-size: 9px !important;
    }
    .printable-receipt-wrapper .text-\\[9px\\] {
      font-size: 8.5px !important;
    }
    .printable-receipt-wrapper .text-\\[8px\\] {
      font-size: 8px !important;
    }

    /* Dividers */
    .printable-receipt-wrapper .border-b {
      border-bottom: 1px dashed #000000 !important;
      padding-bottom: 2px !important;
      margin-bottom: 2px !important;
    }
    .printable-receipt-wrapper .border-t {
      border-top: 1px dashed #000000 !important;
      padding-top: 2px !important;
      margin-top: 2px !important;
    }
    .printable-receipt-wrapper .border {
      border: 1px solid #000000 !important;
    }
    .printable-receipt-wrapper .border-dashed {
      border-style: dashed !important;
      border-color: #000000 !important;
    }

    /* Status badge (PAID IN FULL) */
    .printable-receipt-wrapper span.rounded,
    .printable-receipt-wrapper [class*="rounded"] {
      border-radius: 2px !important;
      padding: 1px 3px !important;
      font-size: 8.5px !important;
      border: 1px solid #000000 !important;
      background: transparent !important;
      color: #000000 !important;
    }

    /* Pure black images for thermal head */
    .printable-receipt-wrapper img {
      max-width: 100% !important;
      height: auto !important;
      filter: brightness(0) !important;
      image-rendering: -webkit-optimize-contrast !important;
      image-rendering: pixelated !important;
      display: inline-block !important;
      margin: 0 auto !important;
    }

    /* Logo size */
    .printable-receipt-wrapper .w-11 {
      width: 40px !important;
      height: 40px !important;
    }

    /* QR Code container sizing */
    .printable-receipt-wrapper .w-24 {
      width: 72px !important;
      height: 72px !important;
      margin: 0 auto !important;
    }

    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 48mm !important;
      }
      .printable-receipt-wrapper {
        margin: 0 !important;
        padding: 0 1mm 2mm 1mm !important;
        width: 48mm !important;
      }
    }
  </style>
</head>
<body>
  <div class="printable-receipt-wrapper">
    ${contentHtml}
  </div>
</body>
</html>`);
  iframeDoc.close();

  const cleanup = () => {
    document.title = originalDocTitle;
    setTimeout(() => {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 2500);
  };

  const executePrint = () => {
    try {
      // Calculate true rendered height of receipt inside iframe at 48mm width
      const wrapper = iframeDoc.querySelector('.printable-receipt-wrapper') as HTMLElement | null;
      const trueHeightPx = wrapper?.offsetHeight || wrapper?.scrollHeight || iframeDoc.body.scrollHeight || 400;
      // 1px = 0.264583mm (at 96dpi). Add 6mm for clean tear-off margin
      const dynamicHeightMm = Math.max(70, Math.ceil((trueHeightPx / 96) * 25.4) + 6);

      // Inject exact @page size so Chrome preview and printer only take the receipt length!
      const dynamicPageStyle = iframeDoc.createElement('style');
      dynamicPageStyle.textContent = `@page { size: 58mm ${dynamicHeightMm}mm !important; margin: 0mm !important; }`;
      iframeDoc.head.appendChild(dynamicPageStyle);

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Iframe print error, falling back to window.print():', err);
      window.print();
    } finally {
      cleanup();
    }
  };

  // Ensure all images (logo, QR code) are fully loaded in the iframe before printing
  const images = iframeDoc.images;
  if (images && images.length > 0) {
    let loadedCount = 0;
    const totalImages = images.length;

    const onImageDone = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setTimeout(executePrint, 150);
      }
    };

    for (let i = 0; i < totalImages; i++) {
      const img = images[i];
      if (img.complete) {
        loadedCount++;
      } else {
        img.addEventListener('load', onImageDone);
        img.addEventListener('error', onImageDone);
      }
    }

    if (loadedCount >= totalImages) {
      setTimeout(executePrint, 150);
    } else {
      // Safety timeout in case an image hangs
      setTimeout(executePrint, 800);
    }
  } else {
    setTimeout(executePrint, 150);
  }

  return true;
}

/**
 * Primary Print Function:
 * 1. Checks if QZ Tray is enabled and attempts direct thermal print to "POS-58 11.3.0.0".
 * 2. If QZ Tray succeeds: silently prints and returns without browser print dialog.
 * 3. If QZ Tray is unavailable or fails: smoothly falls back to the isolated iframe browser print.
 */
export async function printReceipt(
  elementId: string,
  options?: PrintReceiptOptions | string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Prevent multiple simultaneous print triggers
  if (isPrintJobRunning) {
    console.warn('[printReceipt] A print job is already in progress');
    return false;
  }

  const title = typeof options === 'string' ? options : options?.title || 'Brimish-Invoice-Receipt';
  const skipQz = typeof options === 'object' && options?.skipQz === true;
  const preferredPrinter = typeof options === 'object' ? options?.printerName : undefined;

  const settings = getReceiptSettings();

  // If QZ Tray is enabled and not explicitly skipped, attempt direct thermal printing
  if (!skipQz && settings.useQzTray) {
    isPrintJobRunning = true;
    try {
      const qzResult = await printElementWithQz(elementId, {
        printerName: preferredPrinter || settings.printerName || 'POS-58 11.3.0.0',
        paperWidth: settings.paperWidth || '58mm',
        title,
      });

      if (qzResult.success) {
        toast.success(`Printing directly to ${qzResult.printer || 'POS-58'}`, {
          duration: 2500,
        });
        isPrintJobRunning = false;
        return true;
      }

      // QZ Tray attempt failed (e.g., bridge offline), silently activate standard browser print
      console.info('[printReceipt] QZ Tray unavailable, falling back to browser print:', qzResult.error);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.info('[printReceipt] QZ Tray offline, opening browser print:', errMsg);
    } finally {
      isPrintJobRunning = false;
    }
  }

  // Fallback: Use standard high-reliability isolated iframe printing
  return executeIframePrint(elementId, options);
}
