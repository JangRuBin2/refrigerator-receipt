'use client';

/**
 * Haptic feedback hook for mobile devices
 * Uses Vibration API when available
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [30, 50, 30, 50, 30],
};

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function useHaptic() {
  const trigger = (pattern: HapticPattern = 'light') => {
    if (!canVibrate()) return;

    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Vibration API may be blocked
    }
  };

  return {
    trigger,
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
  };
}
