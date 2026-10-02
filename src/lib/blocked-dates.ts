'use client';

import { useState, useEffect } from 'react';

export interface BlockedDateEntry {
  id: string;
  isoDate: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

const STORAGE_KEY = 'brimish_blocked_dates';

export const DEFAULT_BLOCKED_DATES: BlockedDateEntry[] = [];

export function getBlockedDates(): BlockedDateEntry[] {
  if (typeof window === 'undefined') return DEFAULT_BLOCKED_DATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BLOCKED_DATES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BLOCKED_DATES;
  }
}

export function saveBlockedDates(dates: BlockedDateEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
    window.dispatchEvent(new Event('blocked_dates_updated'));
  } catch (err) {
    console.error('Failed to save blocked dates', err);
  }
}

export function addBlockedDate(isoDate: string, reason: string): BlockedDateEntry[] {
  const current = getBlockedDates();
  const filtered = current.filter((d) => d.isoDate !== isoDate);
  const updated: BlockedDateEntry[] = [
    ...filtered,
    {
      id: `blk-${Date.now()}`,
      isoDate,
      reason: reason.trim() || 'Doctor Unavailable / Clinic Closed',
      createdAt: new Date().toISOString(),
    },
  ].sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  saveBlockedDates(updated);
  return updated;
}

export function removeBlockedDate(idOrIsoDate: string): BlockedDateEntry[] {
  const current = getBlockedDates();
  const updated = current.filter((d) => d.id !== idOrIsoDate && d.isoDate !== idOrIsoDate);
  saveBlockedDates(updated);
  return updated;
}

export function isDateBlocked(isoDate: string): { isBlocked: boolean; reason?: string } {
  const dates = getBlockedDates();
  const match = dates.find((d) => d.isoDate === isoDate);
  if (match) {
    return { isBlocked: true, reason: match.reason };
  }
  return { isBlocked: false };
}

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);

  useEffect(() => {
    setBlockedDates(getBlockedDates());

    const handleUpdate = () => {
      setBlockedDates(getBlockedDates());
    };

    window.addEventListener('blocked_dates_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('blocked_dates_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return blockedDates;
}
