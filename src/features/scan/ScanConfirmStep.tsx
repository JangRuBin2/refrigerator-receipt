'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { spring } from '@/lib/animations';
import type { ExtendedScannedItem } from './types';

interface ScanConfirmStepProps {
  previewImage: string | null;
  scannedItems: ExtendedScannedItem[];
  onOpenResults: () => void;
  onReset: () => void;
  onAddToFridge: () => void;
}

export function ScanConfirmStep({
  previewImage,
  scannedItems,
  onOpenResults,
  onReset,
  onAddToFridge,
}: ScanConfirmStepProps) {
  const t = useTranslations();
  const selectedCount = scannedItems.filter((i) => i.selected).length;

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring.gentle}
    >
      <div className="toss-card mb-toss-md border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <div className="flex items-start gap-toss-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <div>
            <p className="toss-body2 font-medium text-yellow-800 dark:text-yellow-300">
              {t('scan.reviewItemsNotice')}
            </p>
            <p className="toss-caption text-yellow-700 dark:text-yellow-400">
              {t('scan.reviewItemsDescription')}
            </p>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="toss-card mb-toss-md">
          <img
            src={previewImage}
            alt="Receipt"
            className="w-full max-h-40 object-contain rounded-lg"
          />
        </div>
      )}

      <button
        onClick={onOpenResults}
        className="toss-card w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="toss-body1 font-semibold">{t('scan.confirmItems')}</p>
            <p className="toss-caption">
              {t('scan.selectedCount', { count: selectedCount })}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </button>

      <div className="flex gap-toss-sm mt-toss-md">
        <Button variant="outline" onClick={onReset} className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('scan.retry')}
        </Button>
        <Button
          onClick={onAddToFridge}
          disabled={selectedCount === 0}
          className="flex-1"
        >
          {t('scan.addToFridge')}
        </Button>
      </div>
    </motion.div>
  );
}
