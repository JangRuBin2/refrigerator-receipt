'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { spring } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface TutorialTooltipProps {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'center';
  mascotEmoji?: string;
  children?: React.ReactNode;
  visible?: boolean;
}

export function TutorialTooltip({
  title,
  description,
  position = 'bottom',
  mascotEmoji = '',
  children,
  visible = true,
}: TutorialTooltipProps) {
  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            'absolute left-4 right-4 z-50',
            positionClasses[position]
          )}
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
          transition={spring.snappy}
        >
          <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
            <div className="flex items-start gap-3">
              {mascotEmoji && (
                <motion.span
                  className="text-3xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.15 }}
                >
                  {mascotEmoji}
                </motion.span>
              )}
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {description}
                </p>
              </div>
            </div>
            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
