'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Camera, PlayCircle } from 'lucide-react';

import { usePremium } from '@/hooks/usePremium';
import { useAppsInTossAds } from '@/hooks/useAppsInTossAds';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import { ScanFailureSheet } from '@/components/scan/ScanFailureSheet';
import { ScanUploadStep } from '@/features/scan/ScanUploadStep';
import { ScanConfirmStep } from '@/features/scan/ScanConfirmStep';
import { ScanResultsSheet } from '@/features/scan/ScanResultsSheet';
import { STEPS } from '@/features/scan/types';
import { useReceiptScan } from '@/features/scan/useReceiptScan';

export default function ScanPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = String(params.locale ?? 'ko');
  const { isPremium } = usePremium();
  const { isAvailable: isAdsAvailable, watchAdForReward } = useAppsInTossAds();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const scan = useReceiptScan({ locale, isPremium, isAdsAvailable, watchAdForReward });
  const currentStepIndex = STEPS.indexOf(scan.step);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-toss-md pb-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-toss-lg">
          {STEPS.map((s, index) => (
            <div key={s} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: index <= currentStepIndex ? '#f97316' : '#e5e7eb',
                  scale: index === currentStepIndex ? 1.2 : 1,
                }}
                className={cn(
                  'h-2 w-2 rounded-full',
                  index <= currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'
                )}
              />
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'h-0.5 w-8 mx-1',
                  index < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {scan.step === 'upload' && (
            <ScanUploadStep
              isPremium={isPremium}
              isMobile={isMobile}
              useAIVision={scan.useAIVision}
              onToggleAIVision={() => scan.setUseAIVision((v) => !v)}
              onScanClick={scan.handleScanClick}
              onFileSelect={scan.handleFileSelect}
              fileInputRef={scan.fileInputRef}
              cameraInputRef={scan.cameraInputRef}
            />
          )}

          {scan.isWatchingAd && (
            <motion.div
              key="ad"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <div className="rounded-2xl bg-white p-8 text-center dark:bg-gray-800">
                <PlayCircle className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
                <p className="mt-4 text-lg font-semibold">{t('scan.watchingAd')}</p>
                <p className="mt-2 text-sm text-gray-500">{t('scan.adWatchingDescription')}</p>
              </div>
            </motion.div>
          )}

          {scan.step === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring.gentle}
              className="flex flex-col items-center py-16"
            >
              {scan.previewImage && (
                <motion.img
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  src={scan.previewImage}
                  alt="Receipt"
                  className="mb-toss-lg max-h-48 rounded-2xl object-contain shadow-lg"
                />
              )}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary-500"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="absolute inset-0 rounded-full bg-primary-500"
                />
                <div className="relative rounded-full bg-primary-600 p-6">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="toss-h3 mt-toss-lg">{t('scan.scanning')}</p>
            </motion.div>
          )}

          {scan.step === 'confirm' && (
            <ScanConfirmStep
              previewImage={scan.previewImage}
              scannedItems={scan.scannedItems}
              onOpenResults={() => scan.setIsResultSheetOpen(true)}
              onReset={scan.reset}
              onAddToFridge={scan.addToFridge}
            />
          )}
        </AnimatePresence>
      </div>

      <ScanResultsSheet
        isOpen={scan.isResultSheetOpen}
        onClose={() => scan.setIsResultSheetOpen(false)}
        items={scan.scannedItems}
        onToggleItem={scan.toggleItem}
        onUpdateItem={scan.updateItem}
        onAddToFridge={scan.addToFridge}
      />

      <ScanFailureSheet
        isOpen={scan.failureError !== null}
        onClose={scan.closeFailure}
        errorMessage={scan.failureError || ''}
        onRetry={() => scan.handleScanClick(isMobile ? scan.cameraInputRef : scan.fileInputRef)}
      />
    </div>
  );
}
