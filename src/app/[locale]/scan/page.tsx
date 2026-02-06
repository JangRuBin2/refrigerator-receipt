'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, Check, RefreshCw, Sparkles, Clock, AlertCircle, Crown, ChevronRight, Play, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BottomSheet, BottomSheetActions } from '@/components/ui/BottomSheet';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { usePremium } from '@/hooks/usePremium';
import { useAppsInTossAds } from '@/hooks/useAppsInTossAds';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { AD_GROUP_IDS } from '@/types/apps-in-toss-ads';
import { calculateExpiryDate, cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import type { ScannedItem, Category, Unit, StorageType } from '@/types';

const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ExtendedScannedItem extends ScannedItem {
  confidence?: number;
  estimatedExpiryDays?: number;
}

const STEPS = ['upload', 'scanning', 'confirm'] as const;
type Step = typeof STEPS[number];

export default function ScanPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { addIngredient } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { isPremium } = usePremium();
  const { isAvailable: isAdsAvailable, adState, watchAdForReward } = useAppsInTossAds();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [canWatchAd, setCanWatchAd] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/receipts/scan');
        if (response.ok) {
          const data = await response.json();
          if (data.usage) {
            setUsage(data.usage);
            setCanWatchAd(data.usage.canWatchAd || false);
          }
        }
      } catch {
        // Ignore
      }
    };
    fetchUsage();
  }, []);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [scannedItems, setScannedItems] = useState<ExtendedScannedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<string>('');
  const [useAIVision, setUseAIVision] = useState(true);
  const [usage, setUsage] = useState<{ dailyLimit: number; used: number; remaining: number } | null>(null);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);

  const currentStepIndex = STEPS.indexOf(step);

  const handleScanClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    // 프리미엄이 아니고 사용량 초과 시 프리미엄 모달 표시
    if (!isPremium && usage && usage.remaining <= 0) {
      setShowPremiumModal(true);
      return;
    }
    inputRef.current?.click();
  };

  const handleWatchAd = async () => {
    if (!isAdsAvailable || isWatchingAd) return;

    setIsWatchingAd(true);
    try {
      const success = await watchAdForReward(async () => {
        // 광고 시청 완료 후 서버에 보상 요청
        const response = await fetch('/api/receipts/ad-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adGroupId: AD_GROUP_IDS.SCAN_REWARDED }),
        });

        if (response.ok) {
          // 사용량 정보 새로고침
          const usageResponse = await fetch('/api/receipts/scan');
          if (usageResponse.ok) {
            const data = await usageResponse.json();
            if (data.usage) {
              setUsage(data.usage);
              setCanWatchAd(data.usage.canWatchAd || false);
            }
          }
          toast.success(t('scan.adWatchSuccess'));
        }
      });

      if (!success) {
        toast.error(t('scan.adWatchFailed'));
      }
    } catch {
      toast.error(t('scan.adWatchFailed'));
    } finally {
      setIsWatchingAd(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('scan.fileTooLarge'));
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      await startScanning(file);
    }
  };

  const startScanning = async (file: File) => {
    setStep('scanning');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('useAIVision', useAIVision.toString());

      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.limitReached) {
          setUsage({ dailyLimit: data.dailyLimit, used: data.currentCount, remaining: 0 });
          if (!data.isPremium) {
            setShowPremiumModal(true);
          }
        }
        throw new Error(data.error || 'Scan failed');
      }

      if (data.usage) {
        setUsage(data.usage);
      }

      const items: ExtendedScannedItem[] = data.items.map((item: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
        confidence?: number;
        estimatedExpiryDays?: number;
      }) => ({
        ...item,
        selected: true,
      }));

      setScannedItems(items);
      setScanMode(data.mode);
      setStep('confirm');
      setIsResultSheetOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
      setStep('upload');
    }
  };

  const toggleItem = (index: number) => {
    setScannedItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
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
      const expiryDate = item.estimatedExpiryDays
        ? new Date(Date.now() + item.estimatedExpiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : calculateExpiryDate(today, item.category || 'etc', 'refrigerated');

      addIngredient({
        name: item.name,
        category: item.category || 'etc',
        quantity: item.quantity || 1,
        unit: item.unit || 'ea',
        storageType: 'refrigerated' as StorageType,
        purchaseDate: today,
        expiryDate,
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

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-200';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getModeInfo = (mode: string) => {
    switch (mode) {
      case 'ai-vision':
        return { label: 'AI Vision', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', isDemo: false };
      case 'ai':
        return { label: 'AI', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', isDemo: false };
      case 'ocr':
        return { label: 'OCR', color: 'text-green-600 bg-green-50 dark:bg-green-900/20', isDemo: false };
      default:
        return { label: 'Demo', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', isDemo: true };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header locale={locale} title={t('scan.title')} />

      <div className="p-toss-md pb-24">
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
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={spring.gentle}
              className="space-y-toss-md"
            >
              {/* Daily Usage */}
              {usage && (
                <div className={cn(
                  'toss-card',
                  usage.remaining > 0
                    ? 'border-l-4 border-primary-500'
                    : 'border-l-4 border-red-500'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-toss-sm">
                      <Camera className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="toss-body2 font-medium">
                          {t('scan.dailyUsage', { used: usage.used, limit: usage.effectiveLimit || usage.dailyLimit })}
                        </p>
                        <p className="toss-caption">
                          {usage.remaining > 0
                            ? `${usage.remaining}회 남음`
                            : '오늘 사용량 초과'}
                        </p>
                      </div>
                    </div>
                    {usage.remaining === 0 && !isPremium && (
                      <button
                        onClick={() => setShowPremiumModal(true)}
                        className="flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        <Crown className="h-3 w-3" />
                        업그레이드
                      </button>
                    )}
                  </div>

                  {/* 광고 시청 버튼 (한도 초과 시) - 준비 중 */}
                  {usage.remaining <= 0 && !isPremium && (
                    <div className="mt-toss-sm pt-toss-sm border-t border-gray-100 dark:border-gray-700">
                      <button
                        disabled
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
                      >
                        <Play className="h-4 w-4" />
                        {t('scan.watchAdForScans')}
                        <span className="ml-1 rounded bg-gray-400 px-1.5 py-0.5 text-xs text-white">
                          {t('common.comingSoon')}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Vision Toggle */}
              <div className="toss-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-toss-sm">
                    <div className="rounded-xl bg-purple-100 p-2 dark:bg-purple-900/30">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="toss-body1 font-medium">{t('scan.aiVisionMode')}</p>
                      <p className="toss-caption">{t('scan.aiVisionDescription')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseAIVision(!useAIVision)}
                    className={cn(
                      'relative h-7 w-12 rounded-full transition-colors',
                      useAIVision ? 'bg-purple-600' : 'bg-gray-300'
                    )}
                  >
                    <motion.span
                      animate={{ x: useAIVision ? 22 : 2 }}
                      transition={spring.snappy}
                      className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {/* Upload Area */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => handleScanClick(isMobile ? cameraInputRef : fileInputRef)}
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
                  onClick={() => handleScanClick(fileInputRef)}
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
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
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

              {/* Pulse Animation */}
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
              {useAIVision && (
                <p className="toss-caption mt-toss-xs flex items-center gap-1 text-purple-600">
                  <Sparkles className="h-4 w-4" />
                  AI Vision analyzing...
                </p>
              )}
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={spring.gentle}
            >
              {/* Mode Badge */}
              {(() => {
                const modeInfo = getModeInfo(scanMode);
                return (
                  <div className={cn('toss-card mb-toss-md', modeInfo.color)}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="toss-body2 font-medium">
                        {modeInfo.isDemo
                          ? 'Demo mode - Configure API for real scanning'
                          : `Analyzed with ${modeInfo.label}`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Preview Image */}
              {previewImage && (
                <div className="toss-card mb-toss-md">
                  <img
                    src={previewImage}
                    alt="Receipt"
                    className="w-full max-h-40 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Results Summary */}
              <button
                onClick={() => setIsResultSheetOpen(true)}
                className="toss-card w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="toss-body1 font-semibold">{t('scan.confirmItems')}</p>
                    <p className="toss-caption">
                      {scannedItems.filter((i) => i.selected).length}개 항목 선택됨
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>

              {/* Actions */}
              <div className="flex gap-toss-sm mt-toss-md">
                <Button variant="outline" onClick={reset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('scan.retry')}
                </Button>
                <Button
                  onClick={addToFridge}
                  disabled={scannedItems.filter((i) => i.selected).length === 0}
                  className="flex-1"
                >
                  {t('scan.addToFridge')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results BottomSheet */}
      <BottomSheet
        isOpen={isResultSheetOpen}
        onClose={() => setIsResultSheetOpen(false)}
        title={t('scan.confirmItems')}
        snapPoints={[80]}
      >
        <div className="space-y-toss-sm">
          {scannedItems.map((item, index) => (
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
                  onClick={() => toggleItem(index)}
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
                      onChange={(e) => updateItem(index, { name: e.target.value })}
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
                      onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) })}
                      className="h-9"
                    />
                    <Select
                      value={item.unit}
                      onChange={(e) => updateItem(index, { unit: e.target.value as Unit })}
                      options={UNITS.map((u) => ({ value: u, label: t(`units.${u}`) }))}
                      className="h-9"
                    />
                    <Select
                      value={item.category}
                      onChange={(e) => updateItem(index, { category: e.target.value as Category })}
                      options={CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
                      className="h-9"
                    />
                  </div>

                  {item.estimatedExpiryDays && (
                    <div className="flex items-center gap-1 toss-caption text-gray-500">
                      <Clock className="h-3 w-3" />
                      {t('scan.estimatedExpiry', { days: item.estimatedExpiryDays })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <BottomSheetActions>
          <Button
            onClick={() => {
              setIsResultSheetOpen(false);
              addToFridge();
            }}
            disabled={scannedItems.filter((i) => i.selected).length === 0}
            className="w-full"
          >
            {t('scan.addToFridge')} ({scannedItems.filter((i) => i.selected).length})
          </Button>
        </BottomSheetActions>
      </BottomSheet>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="receipt_scan"
      />
    </div>
  );
}
