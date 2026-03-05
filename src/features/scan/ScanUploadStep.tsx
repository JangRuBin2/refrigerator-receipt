'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Camera, Upload, Crown, PlayCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { ScanGuide } from '@/components/scan/ScanGuide';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';

interface ScanUploadStepProps {
  isPremium: boolean;
  isMobile: boolean;
  useAIVision: boolean;
  onToggleAIVision: () => void;
  onScanClick: (ref: React.RefObject<HTMLInputElement | null>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ScanUploadStep({
  isPremium,
  isMobile,
  useAIVision,
  onToggleAIVision,
  onScanClick,
  onFileSelect,
  fileInputRef,
  cameraInputRef,
}: ScanUploadStepProps) {
  const t = useTranslations();

  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring.gentle}
      className="space-y-toss-md"
    >
      {isPremium ? (
        <div className="toss-card border-l-4 border-yellow-500">
          <div className="flex items-center gap-toss-sm">
            <Crown className="h-5 w-5 text-yellow-500" />
            <p className="toss-body2 font-medium text-yellow-700 dark:text-yellow-400">
              {t('scan.premiumUnlimited')}
            </p>
          </div>
        </div>
      ) : (
        <div className="toss-card border-l-4 border-blue-500">
          <div className="flex items-center gap-toss-sm">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="toss-body2 font-medium">{t('scan.adRequiredNotice')}</p>
              <p className="toss-caption">{t('scan.adRequiredDescription')}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Mode Toggle */}
      <div className="toss-card">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="toss-body2 font-medium">{t('scan.aiVisionMode')}</p>
            <p className="toss-caption text-gray-500">{t('scan.aiVisionDescription')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={useAIVision}
            onClick={onToggleAIVision}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
              useAIVision ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5',
                useAIVision ? 'translate-x-[22px]' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>
      </div>

      <ScanGuide />

      {/* Upload Area */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onScanClick(isMobile ? cameraInputRef : fileInputRef)}
        className="toss-card cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
      >
        <div className="flex flex-col items-center py-12">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full bg-primary-100 p-6 dark:bg-primary-900/30"
          >
            {isMobile ? (
              <Camera className="h-12 w-12 text-primary-600" />
            ) : (
              <Upload className="h-12 w-12 text-primary-600" />
            )}
          </motion.div>
          <p className="toss-h3 mt-toss-md">
            {isMobile ? t('scan.takePhoto') : t('scan.uploadPhoto')}
          </p>
          <p className="toss-caption mt-toss-xs text-center">
            {t('home.scanDescription')}
          </p>
        </div>
      </motion.div>

      {isMobile && (
        <Button
          variant="outline"
          onClick={() => onScanClick(fileInputRef)}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {t('scan.uploadPhoto')}
        </Button>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />
    </motion.div>
  );
}
