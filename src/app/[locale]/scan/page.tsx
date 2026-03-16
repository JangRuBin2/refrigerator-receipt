'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Camera, PlayCircle } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { usePremium } from '@/hooks/usePremium';
import { useAppsInTossAds } from '@/hooks/useAppsInTossAds';
import { calculateExpiryDate, cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import { scanReceipt } from '@/lib/api/scan';
import { ScanFailureSheet } from '@/components/scan/ScanFailureSheet';
import { CATEGORIES, UNITS } from '@/lib/constants';
import type { StorageType, Category, Unit } from '@/types';
import { ScanUploadStep } from '@/features/scan/ScanUploadStep';
import { ScanConfirmStep } from '@/features/scan/ScanConfirmStep';
import { ScanResultsSheet } from '@/features/scan/ScanResultsSheet';
import { STEPS, type Step, type ExtendedScannedItem } from '@/features/scan/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ScanPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = String(params.locale ?? 'ko');
  const { addIngredient } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { isPremium } = usePremium();
  const { isAvailable: isAdsAvailable, watchAdForReward } = useAppsInTossAds();

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const [step, setStep] = useState<Step>('upload');
  const [scannedItems, setScannedItems] = useState<ExtendedScannedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useAIVision, setUseAIVision] = useState(false);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isFailureSheetOpen, setIsFailureSheetOpen] = useState(false);
  const [lastErrorMessage, setLastErrorMessage] = useState('');
  const pendingFileRef = useRef<File | null>(null);

  const currentStepIndex = STEPS.indexOf(step);

  const handleScanClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    inputRef.current?.click();
  };

  const startScanning = async (file: File) => {
    setStep('scanning');
    try {
      const data = await scanReceipt(file, useAIVision);
      const response = data as Record<string, unknown>;
      const rawItems = Array.isArray(response.items) ? response.items : [];
      const today = new Date().toISOString().split('T')[0];

      const items: ExtendedScannedItem[] = rawItems.map((item) => {
        const raw = item as unknown as Record<string, unknown>;
        const category = (CATEGORIES.includes(String(raw.category) as Category)
          ? String(raw.category)
          : 'etc') as Category;
        const unit = (UNITS.includes(String(raw.unit) as Unit)
          ? String(raw.unit)
          : 'ea') as Unit;
        const estimatedDays = typeof raw.estimatedExpiryDays === 'number' ? raw.estimatedExpiryDays : 0;
        const expiryDate = estimatedDays > 0
          ? new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : calculateExpiryDate(today, category, 'refrigerated');
        return {
          name: String(raw.name ?? ''),
          quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
          unit,
          category,
          confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
          estimatedExpiryDays: estimatedDays || undefined,
          selected: true,
          expiryDate,
        };
      });

      setScannedItems(items);
      setStep('confirm');
      setIsResultSheetOpen(true);
    } catch (err) {
      setLastErrorMessage(err instanceof Error ? err.message : 'Scan failed');
      setIsFailureSheetOpen(true);
      setStep('upload');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('scan.fileTooLarge'));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') setPreviewImage(result);
    };
    reader.readAsDataURL(file);

    if (isPremium) {
      await startScanning(file);
      return;
    }

    if (isAdsAvailable) {
      pendingFileRef.current = file;
      setIsWatchingAd(true);
      const rewarded = await watchAdForReward(() => {});
      setIsWatchingAd(false);

      if (rewarded) {
        const pendingFile = pendingFileRef.current;
        pendingFileRef.current = null;
        if (pendingFile) await startScanning(pendingFile);
      } else {
        toast.error(t('scan.adRequired'));
        pendingFileRef.current = null;
      }
    } else {
      await startScanning(file);
    }
  };

  const toggleItem = (index: number) => {
    setScannedItems((items) =>
      items.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItem = (index: number, updates: Partial<ExtendedScannedItem>) => {
    setScannedItems((items) =>
      items.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const addToFridge = () => {
    const selectedItems = scannedItems.filter((item) => item.selected);
    const today = new Date().toISOString().split('T')[0];

    selectedItems.forEach((item) => {
      addIngredient({
        name: item.name,
        category: item.category || 'etc',
        quantity: item.quantity || 1,
        unit: item.unit || 'ea',
        storageType: 'refrigerated' satisfies StorageType,
        purchaseDate: today,
        expiryDate: item.expiryDate || calculateExpiryDate(today, item.category || 'etc', 'refrigerated'),
      });
    });

    toast.success(t('scan.foundItems', { count: selectedItems.length }));
    router.push(`/${locale}/fridge`);
  };

  const reset = () => {
    setStep('upload');
    setScannedItems([]);
    setPreviewImage(null);
    setIsResultSheetOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

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
          {step === 'upload' && (
            <ScanUploadStep
              isPremium={isPremium}
              isMobile={isMobile}
              useAIVision={useAIVision}
              onToggleAIVision={() => setUseAIVision((v) => !v)}
              onScanClick={handleScanClick}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
            />
          )}

          {isWatchingAd && (
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

          {step === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring.gentle}
              className="flex flex-col items-center py-16"
            >
              {previewImage && (
                <motion.img
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  src={previewImage}
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

          {step === 'confirm' && (
            <ScanConfirmStep
              previewImage={previewImage}
              scannedItems={scannedItems}
              onOpenResults={() => setIsResultSheetOpen(true)}
              onReset={reset}
              onAddToFridge={addToFridge}
            />
          )}
        </AnimatePresence>
      </div>

      <ScanResultsSheet
        isOpen={isResultSheetOpen}
        onClose={() => setIsResultSheetOpen(false)}
        items={scannedItems}
        onToggleItem={toggleItem}
        onUpdateItem={updateItem}
        onAddToFridge={addToFridge}
      />

      <ScanFailureSheet
        isOpen={isFailureSheetOpen}
        onClose={() => setIsFailureSheetOpen(false)}
        errorMessage={lastErrorMessage}
        onRetry={() => handleScanClick(isMobile ? cameraInputRef : fileInputRef)}
      />
    </div>
  );
}
