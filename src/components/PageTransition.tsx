'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { spring, duration, pageTransition } from '@/lib/animations';

type TransitionType = 'slide' | 'fade' | 'scaleFade' | 'none';

interface PageTransitionProps {
  children: ReactNode;
  /** Transition type: slide (default), fade, scaleFade, none */
  type?: TransitionType;
  /** Custom transition duration */
  transitionDuration?: number;
  /** Custom className for the wrapper */
  className?: string;
}

const getVariants = (type: TransitionType): Variants => {
  switch (type) {
    case 'slide':
      return pageTransition.slideFromRight;
    case 'fade':
      return pageTransition.fade;
    case 'scaleFade':
      return pageTransition.scaleFade;
    case 'none':
      return {
        initial: {},
        animate: {},
        exit: {},
      };
    default:
      return pageTransition.slideFromRight;
  }
};

/**
 * PageTransition Component
 *
 * Wraps page content with smooth animations using framer-motion.
 * Uses Toss-style spring animations for natural feel.
 *
 * @example
 * // In a page component
 * <PageTransition>
 *   <div>Page content</div>
 * </PageTransition>
 *
 * @example
 * // With fade transition
 * <PageTransition type="fade">
 *   <div>Modal content</div>
 * </PageTransition>
 */
export function PageTransition({
  children,
  type = 'slide',
  transitionDuration,
  className = '',
}: PageTransitionProps) {
  const pathname = usePathname();

  const variants = getVariants(type);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          ...spring.snappy,
          duration: transitionDuration ?? duration.normal,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

