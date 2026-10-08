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

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'brimish-isolated-print-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
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

  // Collect all styles and stylesheets from the main document
  let copiedStyles = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    copiedStyles += node.outerHTML + '\n';
  });

  // Extract clean HTML content
  const contentHtml = element.innerHTML;

  // Write standalone printable document
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${copiedStyles}
  <style>
    /* ======================================================== */
    /* STANDALONE RECEIPT PRINT STYLES (PURE HIGH CONTRAST)      */
    /* ======================================================== */
    @page {
      size: auto;
      margin: 3mm 4mm;
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
      background: #ffffff !important;
      color: #000000 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 100% !important;
      overflow: visible !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
    }

    body {
      display: flex !important;
      justify-content: center !important;
      align-items: flex-start !important;
      padding: 6px 0 !important;
    }

    .printable-receipt-wrapper {
      width: 100% !important;
      max-width: 340px !important;
      margin: 0 auto !important;
      padding: 10px 8px !important;
      background: #ffffff !important;
      color: #000000 !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
    }

    /* Thermal receipt typography & utility fallbacks */
    .printable-receipt-wrapper * {
      color: #000000 !important;
      text-shadow: none !important;
    }

    /* Prevent solid black blocks on badges in print — convert to clean outlined border */
    .printable-receipt-wrapper .bg-black,
    .printable-receipt-wrapper [class*="bg-black"],
    .printable-receipt-wrapper [class*="bg-stone-900"],
    .printable-receipt-wrapper [class*="bg-gray-900"] {
      background-color: transparent !important;
      background: transparent !important;
      color: #000000 !important;
      border: 1px solid #000000 !important;
    }

    .printable-receipt-wrapper .flex { display: flex !important; }
    .printable-receipt-wrapper .justify-between { justify-content: space-between !important; }
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
    .printable-receipt-wrapper .w-1\\/2 { width: 50% !important; }
    .printable-receipt-wrapper .w-1\\/4 { width: 25% !important; }
    .printable-receipt-wrapper .mx-auto { margin-left: auto !important; margin-right: auto !important; }

    .printable-receipt-wrapper .border-b { border-bottom-width: 1px !important; }
    .printable-receipt-wrapper .border-t { border-top-width: 1px !important; }
    .printable-receipt-wrapper .border { border-width: 1px !important; }
    .printable-receipt-wrapper .border-dashed { border-style: dashed !important; }
    .printable-receipt-wrapper .border-black { border-color: #000000 !important; }

    .printable-receipt-wrapper .border-b,
    .printable-receipt-wrapper .border-t,
    .printable-receipt-wrapper .border {
      border-color: #000000 !important;
    }

    .printable-receipt-wrapper img {
      max-width: 100% !important;
      height: auto !important;
      filter: grayscale(100%) contrast(150%) !important;
      image-rendering: -webkit-optimize-contrast !important;
    }

    @media screen {
      body {
        background: #f5f5f5 !important;
      }
      .printable-receipt-wrapper {
        background: #ffffff !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        margin-top: 20px !important;
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

      // QZ Tray attempt failed (e.g., printer offline, user declined, or connection rejected)
      console.warn('[printReceipt] QZ Tray print failed, activating browser fallback:', qzResult.error);
      const userMessage = qzResult.error
        ? `Thermal print error: ${qzResult.error}. Opening browser print...`
        : 'Direct thermal bridge unavailable. Opening browser print...';
      toast.info(userMessage, {
        duration: 4000,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[printReceipt] Unexpected error with QZ Tray, using browser fallback:', errMsg);
      toast.info(`Thermal bridge error: ${errMsg}. Opening browser print...`, {
        duration: 4000,
      });
    } finally {
      isPrintJobRunning = false;
    }
  }

  // Fallback: Use standard high-reliability isolated iframe printing
  return executeIframePrint(elementId, options);
}
