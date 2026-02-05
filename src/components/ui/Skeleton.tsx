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

/** Skeleton for text lines */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

/** Skeleton for list items */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
}

/** Skeleton for ingredient cards */
export function SkeletonIngredientCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl bg-white dark:bg-gray-800 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="button" className="w-16 h-6" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="text" className="w-16" />
        <Skeleton variant="text" className="w-20" />
      </div>
    </div>
  );
}

/** Skeleton for recipe cards */
export function SkeletonRecipeCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-white dark:bg-gray-800 overflow-hidden', className)}>
      <Skeleton variant="image" className="rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <div className="flex gap-2">
          <Skeleton variant="button" className="w-12 h-5" />
          <Skeleton variant="button" className="w-12 h-5" />
          <Skeleton variant="button" className="w-12 h-5" />
        </div>
      </div>
    </div>
  );
}
