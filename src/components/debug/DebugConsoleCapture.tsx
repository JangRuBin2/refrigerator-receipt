'use client';

import { useEffect } from 'react';
import { useDebugStore } from '@/store/useDebugStore';

/**
 * Captures console.error and console.warn into the debug store.
 * Also captures unhandled errors and promise rejections.
 */
export function DebugConsoleCapture() {
  const isEnabled = useDebugStore((s) => s.isEnabled);
  const addLog = useDebugStore((s) => s.addLog);

  useEffect(() => {
    if (!isEnabled) return;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: unknown[]) => {
      addLog({
        type: 'error',
        source: 'console.error',
        message: args.map((a) => {
          if (a instanceof Error) return `${a.name}: ${a.message}`;
          if (typeof a === 'string') return a;
          try { return JSON.stringify(a); } catch { return String(a); }
        }).join(' '),
      });
      originalError.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      addLog({
        type: 'warn',
        source: 'console.warn',
        message: args.map((a) => typeof a === 'string' ? a : String(a)).join(' '),
      });
      originalWarn.apply(console, args);
    };

    const handleError = (event: ErrorEvent) => {
      addLog({
        type: 'error',
        source: 'window.onerror',
        message: `${event.message} at ${event.filename}:${event.lineno}`,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      addLog({
        type: 'error',
        source: 'unhandledrejection',
        message: reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    addLog({ type: 'info', source: 'debug', message: 'Debug console capture enabled' });

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isEnabled, addLog]);

  return null;
}
