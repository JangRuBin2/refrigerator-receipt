import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SettingsItemProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
}

export function SettingsItem({
  icon: Icon,
  label,
  value,
  onClick,
  danger,
  disabled,
  badge,
}: SettingsItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors',
        danger
          ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700',
        disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            'h-5 w-5',
            danger ? 'text-red-500' : 'text-gray-500'
          )}
        />
        <span className={cn(danger && 'text-red-600', disabled && 'text-gray-400')}>{label}</span>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-gray-500">{value}</span>}
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </button>
  );
}
