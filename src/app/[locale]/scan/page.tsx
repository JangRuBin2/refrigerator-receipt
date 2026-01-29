'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, Check, Loader2, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStore } from '@/store/useStore';
import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { calculateExpiryDate, cn } from '@/lib/utils';
import type { ScannedItem, Category, Unit, StorageType } from '@/types';

const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

export default function ScanPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { addIngredient } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { isPremium, isLoading: isPremiumLoading } = usePremium();

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [step, setStep] = useState<'upload' | 'scanning' | 'confirm'>('upload');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleScanClick = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    inputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      const items: ScannedItem[] = data.items.map((item: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
      }) => ({
        ...item,
        selected: true,
      }));

      setScannedItems(items);
      setScanMode(data.mode);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
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

  const updateItem = (index: number, updates: Partial<ScannedItem>) => {
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
        storageType: 'refrigerated' as StorageType,
        purchaseDate: today,
        expiryDate: calculateExpiryDate(today, item.category || 'etc', 'refrigerated'),
      });
    });

    router.push(`/${locale}/fridge`);
  };

  const reset = () => {
    setStep('upload');
    setScannedItems([]);
    setPreviewImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen">
      <Header locale={locale} title={t('scan.title')} />

      <div className="space-y-4 p-4">
        {step === 'upload' && (
          <>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

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
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <>
            {scanMode === 'simulation' && (
              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Demo mode - Configure OCR API for real receipt scanning
              </div>
            )}

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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleItem(index)}
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border-2',
                            item.selected
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-gray-300'
                          )}
                        >
                          {item.selected && <Check className="h-4 w-4" />}
                        </button>

                        <div className="flex-1">
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              updateItem(index, { name: e.target.value })
                            }
                            className="mb-2 h-8"
                          />
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
