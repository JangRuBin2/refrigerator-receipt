'use client';

import { motion } from 'framer-motion';
import { spring, stagger, listItem, listContainer } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface WelcomeStepProps {
  onNext: () => void;
}

const FEATURES = [
  { icon: '\uD83E\uDDCA', key: 'fridge' },
  { icon: '\uD83D\uDCF7', key: 'scan' },
  { icon: '\uD83C\uDF73', key: 'recipe' },
  { icon: '\u23F0', key: 'expiry' },
] as const;

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const t = useTranslations('tutorial');

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <motion.div
          className="mb-6 text-7xl"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: 0.2 }}
        >
          {'\uD83D\uDC68\u200D\uD83C\uDF73'}
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('welcome.title')}
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
          {t('welcome.description')}
        </p>
      </motion.div>

      <motion.div
        className="mt-8 w-full max-w-sm space-y-3"
        variants={listContainer}
        initial="hidden"
        animate="visible"
      >
        {FEATURES.map((feature) => (
          <motion.div
            key={feature.key}
            className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50"
            variants={listItem}
            transition={spring.snappy}
          >
            <span className="text-2xl">{feature.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t(`welcome.features.${feature.key}.title`)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(`welcome.features.${feature.key}.desc`)}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-8 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.5 }}
      >
        <Button variant="toss" size="xl" onClick={onNext}>
          {t('welcome.startButton')}
        </Button>
      </motion.div>
    </div>
  );
}
