'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spring } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TutorialTooltip } from '../TutorialTooltip';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslations } from 'next-intl';
import { calculateExpiryDate } from '@/lib/utils';
import type { Category, StorageType, Unit } from '@/types';

interface AddIngredientStepProps {
  onNext: () => void;
}

type SubStep = 'intro' | 'name' | 'category' | 'storage' | 'quantity' | 'confirm' | 'done';

const SUB_STEPS: SubStep[] = ['intro', 'name', 'category', 'storage', 'quantity', 'confirm', 'done'];

const GUIDED_INGREDIENT = {
  name: '',
  category: 'vegetables' as Category,
  storageType: 'refrigerated' as StorageType,
  quantity: 3,
  unit: 'ea' as Unit,
};

export function AddIngredientStep({ onNext }: AddIngredientStepProps) {
  const t = useTranslations('tutorial');
  const tc = useTranslations('categories');
  const tu = useTranslations('units');
  const addMockIngredient = useTutorialStore((s) => s.addMockIngredient);

  const [subStep, setSubStep] = useState<SubStep>('intro');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('vegetables');
  const [storageType, setStorageType] = useState<StorageType>('refrigerated');
  const [quantity, setQuantity] = useState(3);
  const [unit, setUnit] = useState<Unit>('ea');
  const [showSuccess, setShowSuccess] = useState(false);

  const subStepIndex = SUB_STEPS.indexOf(subStep);

  const goNext = () => {
    const nextIndex = subStepIndex + 1;
    if (nextIndex < SUB_STEPS.length) {
      setSubStep(SUB_STEPS[nextIndex]);
    }
  };

  const handleConfirm = () => {
    const today = new Date().toISOString().split('T')[0];
    addMockIngredient({
      name: name || t('addIngredient.defaultName'),
      category,
      storageType,
      quantity,
      unit,
      purchaseDate: today,
      expiryDate: calculateExpiryDate(today, category, storageType),
    });
    setShowSuccess(true);
    setTimeout(() => {
      setSubStep('done');
    }, 1200);
  };

  const categoryOptions = [
    { value: 'vegetables', label: tc('vegetables') },
    { value: 'fruits', label: tc('fruits') },
    { value: 'meat', label: tc('meat') },
    { value: 'seafood', label: tc('seafood') },
    { value: 'dairy', label: tc('dairy') },
  ];

  const storageOptions = [
    { value: 'refrigerated', label: t('addIngredient.storage.refrigerated') },
    { value: 'frozen', label: t('addIngredient.storage.frozen') },
    { value: 'room_temp', label: t('addIngredient.storage.roomTemp') },
  ];

  const unitOptions = [
    { value: 'ea', label: tu('ea') },
    { value: 'g', label: tu('g') },
    { value: 'kg', label: tu('kg') },
    { value: 'pack', label: tu('pack') },
  ];

  return (
    <div className="relative flex min-h-[70vh] flex-col px-6 pt-4">
      {/* Sub-step progress dots */}
      <div className="mb-6 flex justify-center gap-2">
        {SUB_STEPS.filter((s) => s !== 'intro' && s !== 'done').map((s, i) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= subStepIndex - 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subStep === 'intro' && (
          <motion.div
            key="intro"
            className="flex flex-1 flex-col items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring.snappy}
          >
            <TutorialTooltip
              title={t('addIngredient.intro.title')}
              description={t('addIngredient.intro.description')}
              mascotEmoji={'\uD83E\uDD66'}
              position="center"
              visible
            >
              <Button variant="toss" onClick={goNext}>
                {t('addIngredient.intro.button')}
              </Button>
            </TutorialTooltip>
          </motion.div>
        )}

        {subStep === 'name' && (
          <motion.div
            key="name"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring.snappy}
          >
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{'\u270D\uFE0F'}</span>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('addIngredient.name.title')}
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t('addIngredient.name.hint')}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Input
                  label={t('addIngredient.name.label')}
                  placeholder={t('addIngredient.name.placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </motion.div>

              <motion.div
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="toss"
                  onClick={goNext}
                  disabled={!name.trim()}
                >
                  {t('common.next')}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {subStep === 'category' && (
          <motion.div
            key="category"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring.snappy}
          >
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{'\uD83D\uDCE6'}</span>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('addIngredient.category.title')}
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t('addIngredient.category.hint')}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition-colors ${
                      category === opt.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'
                    }`}
                    onClick={() => setCategory(opt.value as Category)}
                    whileTap={{ scale: 0.97 }}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>

              <Button variant="toss" className="mt-4" onClick={goNext}>
                {t('common.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {subStep === 'storage' && (
          <motion.div
            key="storage"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring.snappy}
          >
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{'\u2744\uFE0F'}</span>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('addIngredient.storageStep.title')}
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t('addIngredient.storageStep.hint')}
              </p>

              <div className="space-y-2">
                {storageOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    className={`w-full rounded-xl border-2 p-4 text-left font-medium transition-colors ${
                      storageType === opt.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'
                    }`}
                    onClick={() => setStorageType(opt.value as StorageType)}
                    whileTap={{ scale: 0.97 }}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>

              <Button variant="toss" className="mt-4" onClick={goNext}>
                {t('common.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {subStep === 'quantity' && (
          <motion.div
            key="quantity"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring.snappy}
          >
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{'\uD83D\uDD22'}</span>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('addIngredient.quantity.title')}
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t('addIngredient.quantity.hint')}
              </p>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label={t('addIngredient.quantity.label')}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="w-24">
                  <Select
                    label={t('addIngredient.quantity.unitLabel')}
                    options={unitOptions}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Unit)}
                  />
                </div>
              </div>

              <Button variant="toss" className="mt-4" onClick={goNext}>
                {t('common.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {subStep === 'confirm' && (
          <motion.div
            key="confirm"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring.snappy}
          >
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">{'\u2705'}</span>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('addIngredient.confirm.title')}
                </h3>
              </div>

              <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('addIngredient.name.label')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{name || t('addIngredient.defaultName')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('addIngredient.category.title')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tc(category)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('addIngredient.storageStep.title')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {storageOptions.find((o) => o.value === storageType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('addIngredient.quantity.label')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{quantity} {tu(unit)}</span>
                </div>
              </div>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring.bouncy}
                  >
                    <span className="text-xl">{'\uD83C\uDF89'}</span>
                    <span className="font-semibold">{t('addIngredient.confirm.success')}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showSuccess && (
                <Button variant="toss" className="mt-4" onClick={handleConfirm}>
                  {t('addIngredient.confirm.button')}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {subStep === 'done' && (
          <motion.div
            key="done"
            className="flex flex-1 flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.bouncy}
          >
            <motion.span
              className="mb-4 text-6xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {'\uD83D\uDC4F'}
            </motion.span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('addIngredient.done.title')}
            </h3>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              {t('addIngredient.done.description')}
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
