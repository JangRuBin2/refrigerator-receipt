'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { calculateExpiryDate } from '@/lib/utils';
import { scanReceipt } from '@/lib/api/scan';
import { CATEGORIES, UNITS } from '@/lib/constants';
import type { StorageType, Category, Unit } from '@/types';
import type { Step, ExtendedScannedItem } from './types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UseReceiptScanOptions {
  locale: string;
  isPremium: boolean;
  isAdsAvailable: boolean;
  watchAdForReward: (cb: () => void) => Promise<boolean>;
}

export function useReceiptScan({ locale, isPremium, isAdsAvailable, watchAdForReward }: UseReceiptScanOptions) {
  const t = useTranslations();
  const router = useRouter();
  const { addIngredient } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const [step, setStep] = useState<Step>('upload');
  const [scannedItems, setScannedItems] = useState<ExtendedScannedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useAIVision, setUseAIVision] = useState(false);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [failureError, setFailureError] = useState<string | null>(null);

  const startScanning = useCallback(async (file: File) => {
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
      setFailureError(err instanceof Error ? err.message : 'Scan failed');
      setStep('upload');
    }
  }, [useAIVision]);

  const handleScanClick = useCallback((inputRef: React.RefObject<HTMLInputElement | null>) => {
    inputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [isPremium, isAdsAvailable, watchAdForReward, startScanning, t]);

  const toggleItem = useCallback((index: number) => {
    setScannedItems((items) =>
      items.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const updateItem = useCallback((index: number, updates: Partial<ExtendedScannedItem>) => {
    setScannedItems((items) =>
      items.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }, []);

  const addToFridge = useCallback(() => {
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
  }, [scannedItems, addIngredient, router, locale, t]);

  const reset = useCallback(() => {
    setStep('upload');
    setScannedItems([]);
    setPreviewImage(null);
    setIsResultSheetOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const closeFailure = useCallback(() => setFailureError(null), []);

  return {
    // refs
    fileInputRef,
    cameraInputRef,
    // state
    step,
    scannedItems,
    previewImage,
    useAIVision,
    isResultSheetOpen,
    isWatchingAd,
    failureError,
    // actions
    setUseAIVision,
    setIsResultSheetOpen,
    handleScanClick,
    handleFileSelect,
    toggleItem,
    updateItem,
    addToFridge,
    reset,
    closeFailure,
  };
}
