'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Snap points as percentages (0-100). Default: [50, 100] */
  snapPoints?: number[];
  /** Initial snap point index. Default: 0 */
  initialSnap?: number;
  /** Show drag handle indicator */
  showHandle?: boolean;
  /** Allow dismiss by dragging down */
  dismissible?: boolean;
  className?: string;
}

const DISMISS_THRESHOLD = 150;

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [50, 100],
  initialSnap = 0,
  showHandle = true,
  dismissible = true,
  className,
}: BottomSheetProps) {
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (dismissible && info.offset.y > DISMISS_THRESHOLD) {
        onClose();
      }
    },
    [dismissible, onClose]
  );

  const getHeight = (snapPoint: number) => `${snapPoint}vh`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring.snappy}
            drag={dismissible ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ height: getHeight(snapPoints[initialSnap]) }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'bg-white dark:bg-gray-900',
              'rounded-t-3xl shadow-2xl',
              'flex flex-col',
              'touch-pan-y',
              className
            )}
          >
            {/* Handle */}
            {showHandle && (
              <div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="flex min-h-[44px] min-w-[44px] -mr-2 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Convenience component for sheet actions */
export function BottomSheetActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 mt-4 pb-safe', className)}>
      {children}
    </div>
  );
}
