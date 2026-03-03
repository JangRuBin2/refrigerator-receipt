'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  /** Preset variant for common patterns */
  variant?: 'text' | 'avatar' | 'card' | 'button' | 'image';
  /** Width (only for custom sizing) */
  width?: string | number;
  /** Height (only for custom sizing) */
  height?: string | number;
  /** Disable animation */
  static?: boolean;
}

export function Skeleton({
  className,
  variant,
  width,
  height,
  static: isStatic = false,
}: SkeletonProps) {
  const baseStyles = cn(
    'bg-gray-200 dark:bg-gray-700',
    !isStatic && 'animate-pulse',
    'rounded'
  );

  const variantStyles: Record<NonNullable<SkeletonProps['variant']>, string> = {
    text: 'h-4 w-full rounded',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-xl',
    button: 'h-10 w-24 rounded-lg',
    image: 'h-48 w-full rounded-xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(baseStyles, variant && variantStyles[variant], className)}
      style={style}
    />
  );
}
