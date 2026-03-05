import type { ScannedItem } from '@/types';

export interface ExtendedScannedItem extends ScannedItem {
  confidence?: number;
  estimatedExpiryDays?: number;
  expiryDate?: string;
}

export const STEPS = ['upload', 'scanning', 'confirm'] as const;
export type Step = typeof STEPS[number];
