'use client';

import { useState, useEffect } from 'react';

export interface InvoiceReceiptSettings {
  receiptTitle: string;
  receiptDoctor: string;
  receiptSpecialty: string;
  receiptAddress: string;
  receiptPhone: string;
  receiptFooterMessage: string;
  enableQrVerification: boolean;
  printerName: string;
  paperWidth: '58mm' | '80mm';
  useQzTray: boolean;
}

export const DEFAULT_RECEIPT_SETTINGS: InvoiceReceiptSettings = {
  receiptTitle: 'BRIMISH SKIN CARE & LASER CLINIC',
  receiptDoctor: 'DR. BILAL AHMAD (MD Aesthetic Medicine)',
  receiptSpecialty: 'Medical Aesthetics, Dermatology & Laser Center',
  receiptAddress: 'Sami Tower, Ring Road, Peshawar, KP',
  receiptPhone: 'Dr: 0335-6400959 | WhatsApp: 0335-6400959',
  receiptFooterMessage: 'Thank you for trusting Brimish Skin Care. Follow-up valid within 30 days of treatment.',
  enableQrVerification: true,
  printerName: 'POS-80',
  paperWidth: '80mm',
  useQzTray: true,
};

const STORAGE_KEY = 'brimish_receipt_settings';

export function getReceiptSettings(): InvoiceReceiptSettings {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RECEIPT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Auto-migrate to POS-80 with 80mm paper width
    if (parsed.paperWidth !== '80mm' || parsed.printerName !== 'POS-80') {
      parsed.paperWidth = '80mm';
      parsed.printerName = 'POS-80';
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_RECEIPT_SETTINGS, ...parsed }));
      } catch {}
    }

    return { ...DEFAULT_RECEIPT_SETTINGS, ...parsed, paperWidth: '80mm', printerName: 'POS-80' };
  } catch {
    return DEFAULT_RECEIPT_SETTINGS;
  }
}

export function saveReceiptSettings(settings: Partial<InvoiceReceiptSettings>): InvoiceReceiptSettings {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT_SETTINGS;
  try {
    const current = getReceiptSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('receipt_settings_updated'));
    return updated;
  } catch {
    return DEFAULT_RECEIPT_SETTINGS;
  }
}

export function useReceiptSettings() {
  const [settings, setSettings] = useState<InvoiceReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);

  useEffect(() => {
    setSettings(getReceiptSettings());

    const handleUpdate = () => {
      setSettings(getReceiptSettings());
    };

    window.addEventListener('receipt_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('receipt_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return settings;
}
