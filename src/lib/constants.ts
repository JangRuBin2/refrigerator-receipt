import type { Category, Unit, Difficulty } from '@/types';

export const CATEGORIES: Category[] = [
  'vegetables', 'fruits', 'meat', 'seafood', 'dairy',
  'condiments', 'grains', 'beverages', 'snacks', 'etc',
];

export const UNITS: Unit[] = [
  'g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch',
];

export const CATEGORY_EMOJI: Record<Category, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  meat: '🥩',
  seafood: '🐟',
  dairy: '🥛',
  condiments: '🧂',
  grains: '🌾',
  beverages: '🥤',
  snacks: '🍪',
  etc: '📦',
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_EMOJI[category as Category] || '📦';
}

export function getDifficultyColor(difficulty?: string): string {
  if (difficulty === 'easy') return 'bg-green-100 text-green-700';
  if (difficulty === 'medium') return 'bg-yellow-100 text-yellow-700';
  if (difficulty === 'hard') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

export function getDifficultyLabel(difficulty: string | undefined, locale: string): string {
  if (!difficulty) return '';
  const map: Record<string, Record<string, string>> = {
    easy: { ko: '쉬움', en: 'Easy', ja: '簡単', zh: '简单' },
    medium: { ko: '보통', en: 'Medium', ja: '普通', zh: '中等' },
    hard: { ko: '어려움', en: 'Hard', ja: '難しい', zh: '困难' },
  };
  return map[difficulty]?.[locale] || map[difficulty]?.ko || difficulty;
}
