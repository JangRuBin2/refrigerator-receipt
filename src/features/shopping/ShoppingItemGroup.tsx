'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/constants';
import type { ShoppingItem } from '@/types/supabase';

interface ShoppingItemGroupProps {
  category: string;
  items: ShoppingItem[];
  onToggleCheck: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export function ShoppingItemGroup({ category, items, onToggleCheck, onDelete }: ShoppingItemGroupProps) {
  const t = useTranslations();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{getCategoryIcon(category)}</span>
          <span className="font-semibold">{t(`categories.${category}`)}</span>
          <Badge variant="default" className="text-xs">
            {items.filter(i => i.checked).length}/{items.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-all',
                item.checked
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : 'bg-white dark:bg-gray-700'
              )}
            >
              <button
                onClick={() => onToggleCheck(item.id, !item.checked)}
                className="flex-shrink-0"
              >
                {item.checked ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300" />
                )}
              </button>

              <div className={cn('flex-1', item.checked && 'line-through text-gray-400')}>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {item.quantity} {t(`units.${item.unit}`)}
                </span>
              </div>

              <button
                onClick={() => onDelete(item.id)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete item"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
