'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, Check, RefreshCw, Clock, ChevronRight, Crown, PlayCircle, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BottomSheet, BottomSheetActions } from '@/components/ui/BottomSheet';
import { ScanGuide } from '@/components/scan/ScanGuide';
import { ScanFailureSheet } from '@/components/scan/ScanFailureSheet';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { usePremium } from '@/hooks/usePremium';
import { useAppsInTossAds } from '@/hooks/useAppsInTossAds';
import { calculateExpiryDate, cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import { scanReceipt, getLastScanDebugInfo, type ScanDebugInfo } from '@/lib/api/scan';
import type { ScannedItem, StorageType } from '@/types';
import { CATEGORIES, UNITS } from '@/lib/constants';
import { Bug, ChevronDown, ChevronUp, Copy } from 'lucide-react';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ExtendedScannedItem extends ScannedItem {
  confidence?: number;
  estimatedExpiryDays?: number;
  expiryDate?: string;
}

const STEPS = ['upload', 'scanning', 'confirm'] as const;
type Step = typeof STEPS[number];

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
  const { isAvailable: isAdsAvailable, adState, watchAdForReward } = useAppsInTossAds();

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const [step, setStep] = useState<Step>('upload');
  const [scannedItems, setScannedItems] = useState<ExtendedScannedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<string>('');
  const [useAIVision, setUseAIVision] = useState(false);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ScanDebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isFailureSheetOpen, setIsFailureSheetOpen] = useState(false);
  const [lastErrorMessage, setLastErrorMessage] = useState('');
  // 파일 선택 후 광고 시청 대기 시 임시 저장
  const pendingFileRef = useRef<File | null>(null);

  const currentStepIndex = STEPS.indexOf(step);

  // 스캔 버튼 클릭 → 프리미엄이면 바로 스캔, 일반이면 광고 후 스캔
  const handleScanClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    inputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('scan.fileTooLarge'));
      e.target.value = '';
      return;
    }

    // 이미지 미리보기 설정
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setPreviewImage(result);
      }
    };
    reader.readAsDataURL(file);

    // 프리미엄: 바로 스캔
    if (isPremium) {
      await startScanning(file);
      return;
    }

    // 일반 회원: 광고 시청 후 스캔
    if (isAdsAvailable) {
      pendingFileRef.current = file;
      setIsWatchingAd(true);

      const rewarded = await watchAdForReward(() => {
        // 광고 보상 콜백 - 여기서는 별도 처리 불필요
      });

      setIsWatchingAd(false);

      if (rewarded) {
        // 광고 시청 완료 → 스캔 진행
        const pendingFile = pendingFileRef.current;
        pendingFileRef.current = null;
        if (pendingFile) {
          await startScanning(pendingFile);
        }
      } else {
        // 광고 시청 실패/취소
        toast.error(t('scan.adRequired'));
        pendingFileRef.current = null;
      }
    } else {
      // 토스 환경이 아닌 경우 (웹 브라우저) → 바로 스캔 허용
      await startScanning(file);
    }
  };

  const startScanning = async (file: File) => {
    setStep('scanning');
    setDebugInfo(null);

    try {
      const data = await scanReceipt(file, useAIVision);

      // 디버그 정보 캡처
      const scanDebug = getLastScanDebugInfo();
      if (scanDebug) setDebugInfo(scanDebug);

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
      setScanMode(String(response.mode ?? ''));
      setStep('confirm');
      setIsResultSheetOpen(true);
    } catch (err) {
      // 디버그 정보 캡처 (에러 시에도)
      const scanDebug = getLastScanDebugInfo();
      if (scanDebug) setDebugInfo(scanDebug);
      setShowDebug(true);

      const errorMsg = err instanceof Error ? err.message : 'Scan failed';
      setLastErrorMessage(errorMsg);
      setIsFailureSheetOpen(true);
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

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-200';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
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
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={spring.gentle}
              className="space-y-toss-md"
            >
              {/* 프리미엄 안내 배지 */}
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

              {/* AI 모드 토글 */}
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
                    onClick={() => setUseAIVision((v) => !v)}
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

              {/* Scan Guide */}
              <ScanGuide />

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

          {/* 광고 시청 중 */}
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
              {/* 올바르지 않은 항목 안내 */}
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
                      {t('scan.selectedCount', { count: scannedItems.filter((i) => i.selected).length })}
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
                      onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 1 })}
                      className="h-9"
                    />
                    <Select
                      value={item.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (UNITS.includes(val as Unit)) updateItem(index, { unit: val as Unit });
                      }}
                      options={UNITS.map((u) => ({ value: u, label: t(`units.${u}`) }))}
                      className="h-9"
                    />
                    <Select
                      value={item.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (CATEGORIES.includes(val as Category)) updateItem(index, { category: val as Category });
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
                      onChange={(e) => updateItem(index, { expiryDate: e.target.value })}
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

      {/* Scan Failure BottomSheet */}
      <ScanFailureSheet
        isOpen={isFailureSheetOpen}
        onClose={() => setIsFailureSheetOpen(false)}
        errorMessage={lastErrorMessage}
        onRetry={() => handleScanClick(isMobile ? cameraInputRef : fileInputRef)}
      />

      {/* Debug Panel - disabled in production */}
      {false && debugInfo && (
        <div className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-lg">
          <div className="mx-2 rounded-t-xl border border-red-200 bg-red-50 shadow-lg dark:border-red-800 dark:bg-red-950">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex w-full items-center justify-between px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-red-700">
                  Scan Debug {debugInfo.error ? '(ERROR)' : '(OK)'}
                </span>
              </div>
              {showDebug ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {showDebug && (
              <div className="max-h-[50vh] overflow-y-auto px-4 pb-4">
                <button
                  onClick={() => {
                    const text = JSON.stringify(debugInfo, null, 2);
                    navigator.clipboard?.writeText(text);
                    toast.success('Debug info copied');
                  }}
                  className="mb-2 flex items-center gap-1 rounded bg-red-200 px-2 py-1 text-xs dark:bg-red-800"
                >
                  <Copy className="h-3 w-3" />
                  Copy All
                </button>

                <div className="space-y-2 text-xs font-mono">
                  {/* File Info */}
                  <Section title="File Info">
                    <Row label="Name" value={debugInfo.fileInfo.name} />
                    <Row label="Original" value={`${(debugInfo.fileInfo.size / 1024).toFixed(1)} KB`} />
                    {debugInfo.compression && (
                      <>
                        <Row label="Compressed" value={`${(debugInfo.compression.compressedSize / 1024).toFixed(1)} KB (${debugInfo.compression.ratio} saved)`} />
                      </>
                    )}
                    <Row label="MimeType" value={debugInfo.mimeType} />
                    <Row label="Base64" value={`${debugInfo.base64Length.toLocaleString()} chars`} />
                    <Row label="AI Vision" value={debugInfo.useAIVision ? 'ON' : 'OFF'} />
                  </Section>

                  {/* Edge Function Info */}
                  {debugInfo.edgeDebug && (
                    <Section title="Edge Function">
                      <Row label="URL" value={debugInfo.edgeDebug.url} />
                      <Row label="Session" value={debugInfo.edgeDebug.hasSession ? 'YES' : 'NO'} />
                      <Row label="Token" value={debugInfo.edgeDebug.tokenPreview} />
                      <Row label="Status" value={debugInfo.edgeDebug.status !== null ? `${debugInfo.edgeDebug.status} ${debugInfo.edgeDebug.statusText}` : '(no response)'} />
                      <Row label="Duration" value={`${debugInfo.edgeDebug.durationMs}ms`} />
                      <Row label="Time" value={debugInfo.edgeDebug.timestamp} />
                    </Section>
                  )}

                  {/* Error */}
                  {debugInfo.error && (
                    <Section title="Error">
                      <p className="break-all text-red-700 dark:text-red-400">{debugInfo.error}</p>
                    </Section>
                  )}

                  {/* Response Body */}
                  {debugInfo.edgeDebug?.responseBody && (
                    <Section title="Response Body">
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-2 dark:bg-gray-900">
                        {debugInfo.edgeDebug.responseBody}
                      </pre>
                    </Section>
                  )}

                  {/* Result */}
                  {debugInfo.result != null && (
                    <Section title="Parsed Result">
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-2 dark:bg-gray-900">
                        {JSON.stringify(debugInfo.result, null, 2)}
                      </pre>
                    </Section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded bg-white/60 p-2 dark:bg-gray-900/60">
      <p className="mb-1 font-bold text-red-800 dark:text-red-300">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-gray-500">{label}:</span>
      <span className="break-all text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}
