'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spring, listContainer, listItem } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslations } from 'next-intl';
import type { Category, Unit } from '@/types';

interface ScanReceiptStepProps {
  onNext: () => void;
}

interface MockScannedItem {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  selected: boolean;
}

type ScanPhase = 'intro' | 'scanning' | 'results' | 'saved';

export function ScanReceiptStep({ onNext }: ScanReceiptStepProps) {
  const t = useTranslations('tutorial');
  const tc = useTranslations('categories');
  const tu = useTranslations('units');
  const addMockIngredient = useTutorialStore((s) => s.addMockIngredient);
  const [phase, setPhase] = useState<ScanPhase>('intro');
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedItems, setScannedItems] = useState<MockScannedItem[]>([]);

  const mockScanResults: MockScannedItem[] = [
    { name: t('scanReceipt.mockItems.egg'), quantity: 10, unit: 'ea', category: 'dairy', selected: true },
    { name: t('scanReceipt.mockItems.tofu'), quantity: 1, unit: 'pack', category: 'etc', selected: true },
    { name: t('scanReceipt.mockItems.greenOnion'), quantity: 1, unit: 'bunch', category: 'vegetables', selected: true },
    { name: t('scanReceipt.mockItems.porkBelly'), quantity: 300, unit: 'g', category: 'meat', selected: true },
    { name: t('scanReceipt.mockItems.kimchi'), quantity: 1, unit: 'pack', category: 'vegetables', selected: false },
  ];

  const startScan = () => {
    setPhase('scanning');
    setScanProgress(0);
  };

  useEffect(() => {
    if (phase !== 'scanning') return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScannedItems(mockScanResults);
          setPhase('results');
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [phase]);

  const toggleItem = (index: number) => {
    setScannedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const saveSelected = () => {
    const today = new Date().toISOString().split('T')[0];
    const selected = scannedItems.filter((item) => item.selected);
    selected.forEach((item) => {
      addMockIngredient({
        name: item.name,
        category: item.category,
        storageType: 'refrigerated',
        quantity: item.quantity,
        unit: item.unit,
        purchaseDate: today,
        expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
    });
    setPhase('saved');
  };

  return (
    <div className="relative flex min-h-[70vh] flex-col px-6 pt-4">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="flex flex-1 flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring.snappy}
          >
            <motion.div
              className="mb-6 flex h-48 w-48 items-center justify-center rounded-3xl bg-gray-100 dark:bg-gray-700"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={spring.bouncy}
            >
              <span className="text-7xl">{'\uD83D\uDCF7'}</span>
            </motion.div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('scanReceipt.intro.title')}
            </h3>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              {t('scanReceipt.intro.description')}
            </p>

            <div className="mt-6 w-full max-w-sm space-y-3">
              <Button variant="toss" onClick={startScan}>
                {t('scanReceipt.intro.scanButton')}
              </Button>
              <p className="text-center text-xs text-gray-400">
                {t('scanReceipt.intro.hint')}
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            className="flex flex-1 flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring.snappy}
          >
            {/* Fake receipt scanner animation */}
            <div className="relative mb-8 h-64 w-48 overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-200">
              {/* Receipt lines */}
              <div className="space-y-2 p-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded bg-gray-200"
                    style={{ width: `${60 + Math.random() * 40}%` }}
                  />
                ))}
              </div>

              {/* Scanning line */}
              <motion.div
                className="absolute left-0 right-0 h-1 bg-primary-500 shadow-lg shadow-primary-500/50"
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <p className="mb-4 font-semibold text-gray-900 dark:text-white">
              {t('scanReceipt.scanning.title')}
            </p>

            {/* Progress bar */}
            <div className="h-3 w-64 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{scanProgress}%</p>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring.snappy}
          >
            <motion.div
              className="mb-4 rounded-2xl bg-green-50 p-4 dark:bg-green-900/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{'\uD83C\uDF89'}</span>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {t('scanReceipt.results.found', { count: scannedItems.length })}
                  </p>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    {t('scanReceipt.results.hint')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 space-y-2"
              variants={listContainer}
              initial="hidden"
              animate="visible"
            >
              {scannedItems.map((item, index) => (
                <motion.button
                  key={index}
                  className={`flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors ${
                    item.selected
                      ? 'bg-primary-50 ring-2 ring-primary-500 dark:bg-primary-900/20'
                      : 'bg-gray-50 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700'
                  }`}
                  variants={listItem}
                  transition={spring.snappy}
                  onClick={() => toggleItem(index)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    item.selected
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {item.selected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{tc(item.category)}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {item.quantity}{tu(item.unit)}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            <div className="mt-4 pb-4">
              <Button
                variant="toss"
                onClick={saveSelected}
                disabled={!scannedItems.some((i) => i.selected)}
              >
                {t('scanReceipt.results.saveButton', {
                  count: scannedItems.filter((i) => i.selected).length,
                })}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'saved' && (
          <motion.div
            key="saved"
            className="flex flex-1 flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.bouncy}
          >
            <motion.span
              className="mb-4 text-6xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {'\uD83D\uDE80'}
            </motion.span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('scanReceipt.saved.title')}
            </h3>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              {t('scanReceipt.saved.description')}
            </p>
            <Button variant="toss" className="mt-6 max-w-sm" onClick={onNext}>
              {t('common.next')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
