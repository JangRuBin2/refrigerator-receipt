'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Lightbulb, Camera, PenLine } from 'lucide-react';

import { BottomSheet, BottomSheetActions } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

interface ScanFailureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  onRetry: () => void;
}

export function ScanFailureSheet({
  isOpen,
  onClose,
  errorMessage,
  onRetry,
}: ScanFailureSheetProps) {
  const t = useTranslations('scan.failure');
  const params = useParams();
  const router = useRouter();
  const locale = String(params.locale ?? 'ko');

  const handleManualAdd = () => {
    onClose();
    router.push(`/${locale}/fridge`);
  };

  const handleRetry = () => {
    onClose();
    onRetry();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      snapPoints={[55]}
    >
      <div className="space-y-toss-md">
        {/* Error reason card */}
        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {t('errorReason')}
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Tips card */}
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                {t('tipsTitle')}
              </p>
              <ul className="mt-2 space-y-1.5">
                <li className="text-xs text-blue-700 dark:text-blue-400">
                  {t('tipCheckReceipt')}
                </li>
                <li className="text-xs text-blue-700 dark:text-blue-400">
                  {t('tipClearText')}
                </li>
                <li className="text-xs text-blue-700 dark:text-blue-400">
                  {t('tipBrightEnv')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomSheetActions>
        <Button onClick={handleRetry} className="w-full">
          <Camera className="mr-2 h-4 w-4" />
          {t('retryCapture')}
        </Button>
        <Button variant="outline" onClick={handleManualAdd} className="w-full">
          <PenLine className="mr-2 h-4 w-4" />
          {t('manualAdd')}
        </Button>
      </BottomSheetActions>
    </BottomSheet>
  );
}
