'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spring, listContainer, listItem } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { TutorialTooltip } from '../TutorialTooltip';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslations } from 'next-intl';
import { getDaysUntilExpiry, getExpiryColor, formatDate } from '@/lib/utils';
import type { StorageType } from '@/types';

interface ViewFridgeStepProps {
  onNext: () => void;
}

const STORAGE_TABS: { type: StorageType | 'all'; emoji: string }[] = [
  { type: 'all', emoji: '\uD83D\uDCCB' },
  { type: 'refrigerated', emoji: '\u2744\uFE0F' },
  { type: 'frozen', emoji: '\uD83E\uDDCA' },
  { type: 'room_temp', emoji: '\uD83C\uDF21\uFE0F' },
];

export function ViewFridgeStep({ onNext }: ViewFridgeStepProps) {
  const t = useTranslations('tutorial');
  const tc = useTranslations('categories');
  const tu = useTranslations('units');
  const mockIngredients = useTutorialStore((s) => s.mockIngredients);
  const [activeTab, setActiveTab] = useState<StorageType | 'all'>('all');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const filtered = activeTab === 'all'
    ? mockIngredients
    : mockIngredients.filter((i) => i.storageType === activeTab);

  const handleTabClick = (type: StorageType | 'all') => {
    setActiveTab(type);
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowTooltip(false);
    }
  };

  return (
    <div className="relative flex min-h-[70vh] flex-col px-6 pt-4">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring.snappy}
          >
            <div className="rounded-2xl bg-primary-50 p-4 dark:bg-primary-900/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{'\uD83D\uDC46'}</span>
                <div>
                  <p className="font-semibold text-primary-700 dark:text-primary-300">
                    {t('viewFridge.tooltip.title')}
                  </p>
                  <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                    {t('viewFridge.tooltip.description')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storage type tabs */}
      <div className="mb-4 flex gap-2">
        {STORAGE_TABS.map((tab) => (
          <motion.button
            key={tab.type}
            className={`flex-1 rounded-xl py-3 text-center text-sm font-medium transition-colors ${
              activeTab === tab.type
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
            onClick={() => handleTabClick(tab.type)}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">{tab.emoji}</span>
            <br />
            <span className="text-xs">
              {tab.type === 'all'
                ? t('viewFridge.tabs.all')
                : t(`viewFridge.tabs.${tab.type}`)}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Ingredient list */}
      <motion.div
        className="flex-1 space-y-3"
        variants={listContainer}
        initial="hidden"
        animate="visible"
        key={activeTab}
      >
        {filtered.length > 0 ? (
          filtered.map((ingredient) => {
            const days = getDaysUntilExpiry(ingredient.expiryDate);
            return (
              <motion.div
                key={ingredient.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
                variants={listItem}
                transition={spring.snappy}
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {ingredient.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tc(ingredient.category)} | {ingredient.quantity}{tu(ingredient.unit)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-lg px-2 py-1 text-xs font-medium ${getExpiryColor(days)}`}>
                    D{days >= 0 ? `-${days}` : `+${Math.abs(days)}`}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(ingredient.expiryDate)}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl">{'\uD83D\uDCED'}</span>
            <p className="mt-2 text-sm">{t('viewFridge.empty')}</p>
          </div>
        )}
      </motion.div>

      {/* Next button */}
      <motion.div
        className="mt-6 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted ? 1 : 0.5 }}
      >
        <Button variant="toss" onClick={onNext}>
          {t('common.next')}
        </Button>
      </motion.div>
    </div>
  );
}
