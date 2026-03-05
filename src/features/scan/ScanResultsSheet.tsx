'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Clock } from 'lucide-react';

import { BottomSheet, BottomSheetActions } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { CATEGORIES, UNITS } from '@/lib/constants';
import type { ExtendedScannedItem } from './types';

interface ScanResultsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: ExtendedScannedItem[];
  onToggleItem: (index: number) => void;
  onUpdateItem: (index: number, updates: Partial<ExtendedScannedItem>) => void;
  onAddToFridge: () => void;
}

function getConfidenceColor(confidence?: number) {
  if (!confidence) return 'bg-gray-200';
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function ScanResultsSheet({
  isOpen,
  onClose,
  items,
  onToggleItem,
  onUpdateItem,
  onAddToFridge,
}: ScanResultsSheetProps) {
  const t = useTranslations();
  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('scan.confirmItems')}
      snapPoints={[80]}
    >
      <div className="space-y-toss-sm">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'rounded-xl border-2 p-toss-sm transition-colors',
              item.selected
                ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
                : 'border-gray-100 bg-gray-50 opacity-50 dark:border-gray-800 dark:bg-gray-800'
            )}
          >
            <div className="flex items-start gap-toss-sm">
              <button
                onClick={() => onToggleItem(index)}
                className={cn(
                  'mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2',
                  item.selected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              >
                {item.selected && <Check className="h-4 w-4" />}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => onUpdateItem(index, { name: e.target.value })}
                    className="h-9 flex-1"
                  />
                  {item.confidence && (
                    <div className="flex items-center gap-1">
                      <div className={cn('h-2 w-2 rounded-full', getConfidenceColor(item.confidence))} />
                      <span className="toss-caption">{Math.round(item.confidence * 100)}%</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(index, { quantity: parseFloat(e.target.value) || 1 })}
                    className="h-9"
                  />
                  <Select
                    value={item.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (UNITS.includes(val as Unit)) onUpdateItem(index, { unit: val as Unit });
                    }}
                    options={UNITS.map((u) => ({ value: u, label: t(`units.${u}`) }))}
                    className="h-9"
                  />
                  <Select
                    value={item.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (CATEGORIES.includes(val as Category)) onUpdateItem(index, { category: val as Category });
                    }}
                    options={CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
                    className="h-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 shrink-0 text-gray-400" />
                  <Input
                    type="date"
                    value={item.expiryDate || ''}
                    onChange={(e) => onUpdateItem(index, { expiryDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomSheetActions>
        <Button
          onClick={() => {
            onClose();
            onAddToFridge();
          }}
          disabled={selectedCount === 0}
          className="w-full"
        >
          {t('scan.addToFridge')} ({selectedCount})
        </Button>
      </BottomSheetActions>
    </BottomSheet>
  );
}
