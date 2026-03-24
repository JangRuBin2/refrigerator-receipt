'use client';

import { useRef, useEffect } from 'react';
import { useDebugStore } from '@/store/useDebugStore';

/**
 * Tracks render count for a component.
 * Logs a warning when renders exceed threshold in a short window.
 */
export function useDebugRender(componentName: string, threshold = 30) {
  const isEnabled = useDebugStore((s) => s.isEnabled);
  const trackRender = useDebugStore((s) => s.trackRender);
  const addLog = useDebugStore((s) => s.addLog);
  const countRef = useRef(0);
  const windowStartRef = useRef(Date.now());

  if (!isEnabled) return;

  countRef.current += 1;
  trackRender(componentName);

  const now = Date.now();
  const elapsed = now - windowStartRef.current;

  // Check if too many renders in 2 seconds
  if (elapsed < 2000 && countRef.current > threshold) {
    addLog({
      type: 'error',
      source: componentName,
      message: `Possible infinite re-render! ${countRef.current} renders in ${elapsed}ms`,
    });
  }

  // Reset window every 3 seconds
  if (elapsed > 3000) {
    windowStartRef.current = now;
    countRef.current = 0;
  }
}
