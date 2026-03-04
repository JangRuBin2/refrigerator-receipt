'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Info, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';

export function ScanGuide() {
  const t = useTranslations('scan.guide');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="toss-card">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-toss-sm">
          <Info className="h-5 w-5 text-blue-500" />
          <p className="toss-body2 font-medium">{t('title')}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.gentle}
            className="overflow-hidden"
          >
            <div className="mt-toss-sm grid grid-cols-2 gap-toss-sm">
              {/* Good examples */}
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <div className="mb-2 flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                    {t('good')}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  <GuideItem color="green">{t('tipFullReceipt')}</GuideItem>
                  <GuideItem color="green">{t('tipBrightPlace')}</GuideItem>
                  <GuideItem color="green">{t('tipFlatSurface')}</GuideItem>
                </ul>
              </div>

              {/* Bad examples */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div className="mb-2 flex items-center gap-1">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                    {t('bad')}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  <GuideItem color="red">{t('tipPartialOnly')}</GuideItem>
                  <GuideItem color="red">{t('tipBlurryDark')}</GuideItem>
                  <GuideItem color="red">{t('tipCrumpledTilted')}</GuideItem>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideItem({ children, color }: { children: React.ReactNode; color: 'green' | 'red' }) {
  return (
    <li
      className={cn(
        'text-xs leading-relaxed',
        color === 'green'
          ? 'text-green-700 dark:text-green-300'
          : 'text-red-700 dark:text-red-300'
      )}
    >
      {children}
    </li>
  );
}
