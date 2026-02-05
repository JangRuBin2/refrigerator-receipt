'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type Toast as ToastType } from '@/store/useToastStore';
import { spring } from '@/lib/animations';
import { useHaptic } from '@/hooks/useHaptic';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-gray-900 dark:bg-white',
  error: 'bg-gray-900 dark:bg-white',
  warning: 'bg-gray-900 dark:bg-white',
  info: 'bg-gray-900 dark:bg-white',
};

const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

const progressColors = {
  success: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-yellow-400',
  info: 'bg-blue-400',
};

const SWIPE_THRESHOLD = 100;

const ToastItem = ({ toast }: { toast: ToastType }) => {
  const { removeToast } = useToastStore();
  const { light } = useHaptic();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const Icon = icons[toast.type];

  useEffect(() => {
    if (toast.duration === Infinity || isPaused) return;

    const startTime = Date.now();
    const endTime = startTime + toast.duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / toast.duration) * 100;
      setProgress(newProgress);

      if (newProgress > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    const frame = requestAnimationFrame(updateProgress);
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [toast.id, toast.duration, isPaused, removeToast]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.offset.y) > SWIPE_THRESHOLD) {
        light();
        removeToast(toast.id);
      }
    },
    [toast.id, removeToast, light]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={spring.snappy}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      onHoverStart={() => setIsPaused(true)}
      onHoverEnd={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-lg cursor-grab active:cursor-grabbing',
        'min-w-[300px] max-w-[380px]',
        styles[toast.type]
      )}
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[toast.type])} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-semibold text-white dark:text-gray-900 text-sm">
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p className={cn(
              'text-sm text-gray-300 dark:text-gray-600',
              toast.title && 'mt-0.5'
            )}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            light();
            removeToast(toast.id);
          }}
          className="flex-shrink-0 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity text-white dark:text-gray-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 dark:bg-gray-200">
          <motion.div
            className={cn('h-full', progressColors[toast.type])}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none pb-safe">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
