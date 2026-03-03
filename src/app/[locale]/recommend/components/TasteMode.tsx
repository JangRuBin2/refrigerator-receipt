'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, ChefHat, Loader2, RotateCcw, Clock, Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getDifficultyColor, getDifficultyLabel } from '@/lib/constants';
import { tasteQuestions, type ScoredRecipe } from '@/lib/recommend/engine';
import { scoreByTaste } from '@/lib/api/recipes';
import { RecipeCard } from './RecipeCard';

interface TasteModeProps {
  locale: string;
  onBack: () => void;
}

function getTitle(title: Record<string, string>, locale: string) {
  return title[locale] || title.ko || title.en || '';
}

function getSearchUrl(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' 레시피')}`;
}

export function TasteMode({ locale, onBack }: TasteModeProps) {
  const t = useTranslations();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tasteResults, setTasteResults] = useState<ScoredRecipe[]>([]);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    if (currentStep < tasteQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitTaste(newAnswers);
    }
  };

  const submitTaste = async (finalAnswers: Record<string, string>) => {
    setTasteLoading(true);
    try {
      const data = await scoreByTaste(finalAnswers);
      if (Array.isArray(data)) {
        setTasteResults(data);
      }
    } catch {
      console.error('Failed to score by taste');
    } finally {
      setTasteLoading(false);
      setShowResults(true);
    }
  };

  const resetTaste = () => {
    setCurrentStep(0);
    setAnswers({});
    setTasteResults([]);
    setShowResults(false);
  };

  const getLocalizedDifficultyLabel = (d?: string) => getDifficultyLabel(d, locale);

  if (showResults) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            <Sparkles className="mr-1 h-3 w-3" />
            {t('recommend.tasteMode')}
          </Badge>
        </div>
        <h2 className="text-lg font-bold">{t('recommend.result')}</h2>

        {tasteLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : tasteResults.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">{t('recommend.noResult')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <RecipeCard recipe={tasteResults[0]} locale={locale} isBest />

            {tasteResults.length > 1 && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-gray-500">
                  {t('recommend.otherOptions')}
                </h3>
                <div className="space-y-3">
                  {tasteResults.slice(1).map((recipe) => (
                    <Card key={recipe.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{getTitle(recipe.title, locale)}</h4>
                            <div className="mt-1 flex items-center gap-2">
                              {recipe.cooking_time && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {recipe.cooking_time}분
                                </span>
                              )}
                              {recipe.difficulty && (
                                <Badge className={cn('text-xs', getDifficultyColor(recipe.difficulty))}>
                                  {getLocalizedDifficultyLabel(recipe.difficulty)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <a
                            href={getSearchUrl(getTitle(recipe.title, locale))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-2 text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label={t('recommend.searchThis')}
                          >
                            <Search className="h-5 w-5" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <Button
          variant="outline"
          onClick={resetTaste}
          className="w-full"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('recommend.retry')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => { onBack(); resetTaste(); }}
          className="w-full"
        >
          {t('recommend.backToSelect')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          <Sparkles className="mr-1 h-3 w-3" />
          {t('recommend.tasteMode')}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tasteQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-500">
          {t('recommend.stepOf', { current: currentStep + 1, total: tasteQuestions.length })}
        </span>
      </div>

      {/* Question Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="p-6">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="mb-6 text-xl font-bold">
            {tasteQuestions[currentStep].question[locale] || tasteQuestions[currentStep].question.ko}
          </h2>

          <div className="space-y-3">
            {tasteQuestions[currentStep].options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(tasteQuestions[currentStep].id, option.id)}
                className={cn(
                  'w-full rounded-xl border-2 border-transparent bg-white px-5 py-4 text-left text-base font-medium shadow-sm transition-all hover:border-purple-300 hover:shadow-md active:scale-[0.98] dark:bg-gray-800 dark:hover:border-purple-600',
                  answers[tasteQuestions[currentStep].id] === option.id && 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                )}
              >
                {option.label[locale] || option.label.ko}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Back / Reset */}
      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1"
          >
            {t('recommend.previous')}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => { onBack(); resetTaste(); }}
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('recommend.retry')}
        </Button>
      </div>
    </div>
  );
}
