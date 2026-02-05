/**
 * Toss-style Animation Tokens
 * Spring-based animations for natural feel
 */

export const spring = {
  /** Gentle spring for subtle movements */
  gentle: { type: 'spring' as const, damping: 20, stiffness: 100 },
  /** Snappy spring for quick feedback */
  snappy: { type: 'spring' as const, damping: 25, stiffness: 300 },
  /** Bouncy spring for playful interactions */
  bouncy: { type: 'spring' as const, damping: 10, stiffness: 200 },
  /** Stiff spring for immediate response */
  stiff: { type: 'spring' as const, damping: 30, stiffness: 400 },
} as const;

export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

export const easing = {
  /** Toss custom easing - smooth deceleration */
  toss: [0.25, 0.1, 0.25, 1] as const,
  /** Ease out for exits */
  easeOut: [0, 0, 0.2, 1] as const,
  /** Ease in for entries */
  easeIn: [0.4, 0, 1, 1] as const,
} as const;

/** Common animation variants */
export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  /** Press feedback for buttons */
  press: {
    tap: { scale: 0.97 },
  },
} as const;

/** Stagger children animation config */
export const stagger = {
  fast: { staggerChildren: 0.03 },
  normal: { staggerChildren: 0.05 },
  slow: { staggerChildren: 0.1 },
} as const;
