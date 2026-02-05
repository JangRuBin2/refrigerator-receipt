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

interface FadeTransitionProps {
  children: ReactNode;
  /** Whether the content is visible */
  show: boolean;
  /** Custom className */
  className?: string;
}

/**
 * FadeTransition Component
 *
 * Simple fade in/out transition for conditional content.
 *
 * @example
 * <FadeTransition show={isVisible}>
 *   <div>Conditional content</div>
 * </FadeTransition>
 */
export function FadeTransition({
  children,
  show,
  className = '',
}: FadeTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  /** Whether the content is visible */
  show: boolean;
  /** Slide direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Custom className */
  className?: string;
}

const slideVariants: Record<string, Variants> = {
  up: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  down: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  left: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  right: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
};

/**
 * SlideTransition Component
 *
 * Slide transition with direction control.
 *
 * @example
 * <SlideTransition show={isOpen} direction="up">
 *   <div>Sliding content</div>
 * </SlideTransition>
 */
export function SlideTransition({
  children,
  show,
  direction = 'up',
  className = '',
}: SlideTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants[direction]}
          transition={spring.snappy}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
