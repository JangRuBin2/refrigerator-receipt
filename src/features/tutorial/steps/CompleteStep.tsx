'use client';

import { motion } from 'framer-motion';
import { spring, listContainer, listItem } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useTutorialStore } from '@/store/useTutorialStore';

export function CompleteStep() {
  const t = useTranslations('tutorial');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ko';
  const exit = useTutorialStore((s) => s.exit);

  const handleStart = () => {
    exit();
    router.push(`/${locale}`);
  };

  const features = [
    { emoji: '\u2705', key: 'addIngredient' },
    { emoji: '\u2705', key: 'viewFridge' },
    { emoji: '\u2705', key: 'checkExpiry' },
    { emoji: '\u2705', key: 'scanReceipt' },
    { emoji: '\u2705', key: 'viewRecipes' },
  ] as const;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <motion.div
          className="mb-4 text-7xl"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: 0.2 }}
        >
          {'\uD83C\uDF89'}
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('complete.title')}
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
          {t('complete.description')}
        </p>
      </motion.div>

      {/* Completed checklist */}
      <motion.div
        className="mt-8 w-full max-w-sm space-y-2"
        variants={listContainer}
        initial="hidden"
        animate="visible"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.key}
            className="flex items-center gap-3 rounded-xl bg-green-50 p-3 dark:bg-green-900/20"
            variants={listItem}
            transition={spring.snappy}
          >
            <span>{feature.emoji}</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {t(`complete.features.${feature.key}`)}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-8 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.8 }}
      >
        <Button variant="toss" size="xl" onClick={handleStart}>
          {t('complete.startButton')}
        </Button>
      </motion.div>
    </div>
  );
}
