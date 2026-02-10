import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(days: number): 'expired' | 'critical' | 'warning' | 'ok' {
  if (days < 0) return 'expired';
  if (days === 0) return 'critical';
  if (days <= 3) return 'warning';
  return 'ok';
}

export function getExpiryColor(days: number): string {
  const status = getExpiryStatus(days);
  switch (status) {
    case 'expired':
      return 'text-gray-500 bg-gray-100';
    case 'critical':
      return 'text-red-700 bg-red-100';
    case 'warning':
      return 'text-orange-700 bg-orange-100';
    default:
      return 'text-green-700 bg-green-100';
  }
}

export function formatDate(date: string, locale: string = 'ko'): string {
  return new Date(date).toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getDefaultExpiryDays(category: string, storageType: string): number {
  const expiryMap: Record<string, Record<string, number>> = {
    vegetables: { refrigerated: 7, frozen: 60, room_temp: 3 },
    fruits: { refrigerated: 7, frozen: 30, room_temp: 5 },
    meat: { refrigerated: 5, frozen: 180, room_temp: 0 },
    seafood: { refrigerated: 2, frozen: 90, room_temp: 0 },
    dairy: { refrigerated: 14, frozen: 60, room_temp: 0 },
    condiments: { refrigerated: 180, frozen: 365, room_temp: 90 },
    grains: { refrigerated: 180, frozen: 365, room_temp: 90 },
    beverages: { refrigerated: 7, frozen: 30, room_temp: 30 },
    snacks: { refrigerated: 30, frozen: 90, room_temp: 30 },
    etc: { refrigerated: 7, frozen: 30, room_temp: 7 },
  };

  return expiryMap[category]?.[storageType] ?? 7;
}

export function calculateExpiryDate(purchaseDate: string, category: string, storageType: string): string {
  const days = getDefaultExpiryDays(category, storageType);
  const date = new Date(purchaseDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
  }
  return 'Unknown error';
}
