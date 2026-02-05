'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring, variants } from '@/lib/animations';
import { useHaptic } from '@/hooks/useHaptic';
import { Skeleton } from './Skeleton';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'toss';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  /** Enable haptic feedback on press */
  haptic?: boolean;
  /** Show skeleton instead of loading spinner */
  skeleton?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      haptic = true,
      skeleton = false,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { light } = useHaptic();

    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl';

    const variantStyles = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 active:bg-primary-800',
      secondary:
        'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
      outline:
        'border-2 border-gray-200 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-700 dark:hover:bg-gray-800',
      ghost:
        'bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500 dark:hover:bg-gray-800',
      danger:
        'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 active:bg-red-700',
      /** Toss style - full width, prominent */
      toss:
        'w-full bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 active:bg-primary-800',
    };

    const sizeStyles = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-6 text-base',
      xl: 'h-14 px-8 text-base',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic) {
        light();
      }
      onClick?.(e);
    };

    if (isLoading && skeleton) {
      return (
        <Skeleton
          className={cn(
            'rounded-xl',
            sizeStyles[size],
            variant === 'toss' && 'w-full'
          )}
        />
      );
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        onClick={handleClick}
        whileTap={variants.press.tap}
        transition={spring.snappy}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span className="opacity-80">Loading...</span>
          </div>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

/** Icon button variant */
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'children'> & { icon: React.ReactNode; label: string }
>(({ icon, label, className, size = 'md', ...props }, ref) => {
  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
  };

  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn('p-0', sizeStyles[size], className)}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';
