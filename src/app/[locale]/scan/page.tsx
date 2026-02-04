'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, Check, Loader2, RefreshCw, Sparkles, Clock, AlertCircle, Crown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { calculateExpiryDate, cn } from '@/lib/utils';
import type { ScannedItem, Category, Unit, StorageType } from '@/types';

const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ExtendedScannedItem extends ScannedItem {
  confidence?: number;
  estimatedExpiryDays?: number;
}

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

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // 페이지 로드 시 사용량 조회
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/receipts/scan');
        if (response.ok) {
          const data = await response.json();
          if (data.usage) {
            setUsage(data.usage);
          }
        }
      } catch {
        // 조회 실패 시 무시
      }
    };
    fetchUsage();
  }, []);

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [step, setStep] = useState<'upload' | 'scanning' | 'confirm'>('upload');
  const [scannedItems, setScannedItems] = useState<ExtendedScannedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<string>('');
  const [useAIVision, setUseAIVision] = useState(true);
  const [usage, setUsage] = useState<{ dailyLimit: number; used: number; remaining: number } | null>(null);

  const handleScanClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    inputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 용량 검증
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
        // 일일 제한 도달
        if (response.status === 429 && data.limitReached) {
          setUsage({ dailyLimit: data.dailyLimit, used: data.currentCount, remaining: 0 });
          if (!data.isPremium) {
            setShowPremiumModal(true);
          }
        }
        throw new Error(data.error || 'Scan failed');
      }

      // 사용량 정보 업데이트
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
      // AI가 추정한 유통기한 사용 또는 기본값
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-200';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'ai-vision':
        return { label: 'AI Vision', icon: Sparkles, color: 'text-purple-600 bg-purple-50', isDemo: false };
      case 'ai':
        return { label: 'AI', icon: Sparkles, color: 'text-blue-600 bg-blue-50', isDemo: false };
      case 'ocr':
        return { label: 'OCR', icon: Camera, color: 'text-green-600 bg-green-50', isDemo: false };
      default:
        return { label: 'Demo', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', isDemo: true };
    }
  };

  return (
    <div className="min-h-screen">
      <Header locale={locale} title={t('scan.title')} />

      <div className="space-y-4 p-4">
        {step === 'upload' && (
          <>
            {/* Daily Usage Info */}
            {usage && (
              <div className={cn(
                'flex items-center justify-between rounded-lg p-3 text-sm',
                usage.remaining > 0
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              )}>
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  {t('scan.dailyUsage', { used: usage.used, limit: usage.dailyLimit })}
                </span>
                {usage.remaining === 0 && !isPremium && (
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    <Crown className="h-3 w-3" />
                    업그레이드
                  </button>
                )}
              </div>
            )}

            {/* AI Vision Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">{t('scan.aiVisionMode')}</p>
                      <p className="text-xs text-gray-500">{t('scan.aiVisionDescription')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseAIVision(!useAIVision)}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      useAIVision ? 'bg-purple-600' : 'bg-gray-300'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                        useAIVision && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            {isMobile && (
              <>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div
                      onClick={() => handleScanClick(cameraInputRef)}
                      className="flex cursor-pointer flex-col items-center justify-center bg-gray-50 py-16 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <div className="mb-4 rounded-full bg-primary-100 p-4 dark:bg-primary-900">
                        <Camera className="h-8 w-8 text-primary-600" />
                      </div>
                      <p className="text-lg font-medium">{t('scan.takePhoto')}</p>
                      <p className="mt-1 text-sm text-gray-500">{t('home.scanDescription')}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500 dark:bg-gray-800">
                      or
                    </span>
                  </div>
                </div>
              </>
            )}

            {!isMobile && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    onClick={() => handleScanClick(fileInputRef)}
                    className="flex cursor-pointer flex-col items-center justify-center bg-gray-50 py-16 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <div className="mb-4 rounded-full bg-primary-100 p-4 dark:bg-primary-900">
                      <Upload className="h-8 w-8 text-primary-600" />
                    </div>
                    <p className="text-lg font-medium">{t('scan.uploadPhoto')}</p>
                    <p className="mt-1 text-sm text-gray-500">{t('home.scanDescription')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Camera input (mobile only) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* File upload input (no capture = file picker) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}

        {step === 'scanning' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Receipt"
                  className="mb-6 max-h-48 rounded-lg object-contain"
                />
              )}
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary-600" />
              <p className="text-lg font-medium">{t('scan.scanning')}</p>
              {useAIVision && (
                <p className="mt-2 flex items-center gap-1 text-sm text-purple-600">
                  <Sparkles className="h-4 w-4" />
                  AI Vision analyzing...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <>
            {/* Mode indicator */}
            {(() => {
              const modeInfo = getModeLabel(scanMode);
              const ModeIcon = modeInfo.icon;
              return (
                <div className={cn('flex items-center gap-2 rounded-lg p-3 text-sm', modeInfo.color)}>
                  <ModeIcon className="h-4 w-4" />
                  <span>
                    {modeInfo.isDemo
                      ? 'Demo mode - Configure OCR API for real receipt scanning'
                      : `Analyzed with ${modeInfo.label}`}
                  </span>
                </div>
              );
            })()}

            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">{t('scan.confirmItems')}</h3>
                  <span className="text-sm text-gray-500">
                    {t('scan.foundItems', {
                      count: scannedItems.filter((i) => i.selected).length,
                    })}
                  </span>
                </div>

                <div className="space-y-3">
                  {scannedItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        item.selected
                          ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
                          : 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleItem(index)}
                          className={cn(
                            'mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2',
                            item.selected
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-gray-300'
                          )}
                        >
                          {item.selected && <Check className="h-4 w-4" />}
                        </button>

                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                updateItem(index, { name: e.target.value })
                              }
                              className="h-8 flex-1"
                            />
                            {item.confidence && (
                              <div className="flex items-center gap-1" title={`Confidence: ${Math.round(item.confidence * 100)}%`}>
                                <div className={cn('h-2 w-2 rounded-full', getConfidenceColor(item.confidence))} />
                                <span className="text-xs text-gray-500">{Math.round(item.confidence * 100)}%</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, {
                                  quantity: parseFloat(e.target.value),
                                })
                              }
                              className="h-8"
                            />
                            <Select
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(index, { unit: e.target.value as Unit })
                              }
                              options={UNITS.map((u) => ({
                                value: u,
                                label: t(`units.${u}`),
                              }))}
                              className="h-8"
                            />
                            <Select
                              value={item.category}
                              onChange={(e) =>
                                updateItem(index, {
                                  category: e.target.value as Category,
                                })
                              }
                              options={CATEGORIES.map((c) => ({
                                value: c,
                                label: t(`categories.${c}`),
                              }))}
                              className="h-8"
                            />
                          </div>

                          {item.estimatedExpiryDays && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {t('scan.estimatedExpiry', { days: item.estimatedExpiryDays })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
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
          </>
        )}

        {/* Premium Gate Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          feature="receipt_scan"
        />
      </div>
    </div>
  );
}
