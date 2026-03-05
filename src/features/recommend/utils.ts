export { getDifficultyColor, getDifficultyLabel } from '@/lib/constants';

export const getTitle = (title: Record<string, string>, locale: string) =>
  title[locale] || title.ko || title.en || '';

const SEARCH_KEYWORDS: Record<string, string> = {
  ko: '레시피',
  en: 'recipe',
  ja: 'レシピ',
  zh: '食谱',
};

export const getSearchUrl = (name: string, locale: string = 'ko') =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' ' + (SEARCH_KEYWORDS[locale] || SEARCH_KEYWORDS.ko))}`;
