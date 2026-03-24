'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spring, listContainer, listItem } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslations } from 'next-intl';

interface ViewRecipesStepProps {
  onNext: () => void;
}

interface MockRecipe {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  time: number;
  difficulty: string;
  matchRate: number;
}

export function ViewRecipesStep({ onNext }: ViewRecipesStepProps) {
  const t = useTranslations('tutorial');
  const mockIngredients = useTutorialStore((s) => s.mockIngredients);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);

  const mockRecipes: MockRecipe[] = [
    { id: '1', emoji: '\uD83C\uDF73', titleKey: 'eggStew', descKey: 'eggStewDesc', time: 15, difficulty: 'easy', matchRate: 85 },
    { id: '2', emoji: '\uD83C\uDF56', titleKey: 'porkStirFry', descKey: 'porkStirFryDesc', time: 20, difficulty: 'easy', matchRate: 70 },
    { id: '3', emoji: '\uD83C\uDF5C', titleKey: 'tofuSoup', descKey: 'tofuSoupDesc', time: 25, difficulty: 'medium', matchRate: 60 },
  ];

  const handleSpin = () => {
    setIsSpinning(true);
    setShowRoulette(true);
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedRecipe(mockRecipes[Math.floor(Math.random() * mockRecipes.length)].id);
    }, 2000);
  };

  const selected = mockRecipes.find((r) => r.id === selectedRecipe);

  return (
    <div className="relative flex min-h-[70vh] flex-col px-6 pt-4">
      {/* Header */}
      <motion.div
        className="mb-4 rounded-2xl bg-purple-50 p-4 dark:bg-purple-900/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.snappy}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{'\uD83C\uDF73'}</span>
          <div>
            <p className="font-semibold text-purple-700 dark:text-purple-300">
              {t('viewRecipes.title')}
            </p>
            <p className="mt-1 text-sm text-purple-600 dark:text-purple-400">
              {t('viewRecipes.description', { count: mockIngredients.length })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Roulette button */}
      <motion.div
        className="mb-4 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 px-8 py-4 text-white shadow-lg"
          onClick={handleSpin}
          disabled={isSpinning}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            className="text-4xl"
            animate={isSpinning ? { rotate: 360 } : {}}
            transition={isSpinning ? { duration: 0.5, repeat: Infinity, ease: 'linear' } : {}}
          >
            {'\uD83C\uDFB0'}
          </motion.span>
          <span className="text-sm font-semibold">
            {isSpinning ? t('viewRecipes.spinning') : t('viewRecipes.spinButton')}
          </span>
        </motion.button>
      </motion.div>

      {/* Selected recipe highlight */}
      <AnimatePresence>
        {selected && !isSpinning && (
          <motion.div
            className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-50 to-purple-50 p-5 shadow-md ring-2 ring-primary-500 dark:from-primary-900/20 dark:to-purple-900/20"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={spring.bouncy}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary-600 dark:text-primary-400">
              {'\u2728'} {t('viewRecipes.recommended')}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl">{selected.emoji}</span>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t(`viewRecipes.recipes.${selected.titleKey}`)}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t(`viewRecipes.recipes.${selected.descKey}`)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span>{'\u23F1'} {selected.time}{t('viewRecipes.minutes')}</span>
              <span>{'\uD83D\uDCCA'} {t(`viewRecipes.difficulty.${selected.difficulty}`)}</span>
              <span className="font-semibold text-green-600">{selected.matchRate}% {t('viewRecipes.match')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe list */}
      <motion.div
        className="flex-1 space-y-3"
        variants={listContainer}
        initial="hidden"
        animate="visible"
      >
        {mockRecipes.map((recipe) => (
          <motion.div
            key={recipe.id}
            className={`flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 transition-colors ${
              selectedRecipe === recipe.id
                ? 'ring-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                : 'ring-black/5 dark:bg-gray-800 dark:ring-white/10'
            }`}
            variants={listItem}
            transition={spring.snappy}
            onClick={() => setSelectedRecipe(recipe.id)}
          >
            <span className="text-3xl">{recipe.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {t(`viewRecipes.recipes.${recipe.titleKey}`)}
              </p>
              <p className="text-xs text-gray-500">
                {recipe.time}{t('viewRecipes.minutes')} | {t(`viewRecipes.difficulty.${recipe.difficulty}`)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {recipe.matchRate}%
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-6 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button variant="toss" onClick={onNext}>
          {t('common.next')}
        </Button>
      </motion.div>
    </div>
  );
}
