export const getTitle = (title: Record<string, string>, locale: string) =>
  title[locale] || title.ko || title.en || '';

export const getSearchUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' 레시피')}`;

export const getDifficultyLabel = (d: string | undefined, locale: string) => {
  if (!d) return '';
  const map: Record<string, Record<string, string>> = {
    easy: { ko: '쉬움', en: 'Easy', ja: '簡単', zh: '简单' },
    medium: { ko: '보통', en: 'Medium', ja: '普通', zh: '中等' },
    hard: { ko: '어려움', en: 'Hard', ja: '難しい', zh: '困难' },
  };
  return map[d]?.[locale] || map[d]?.ko || d;
};

export const getDifficultyColor = (d?: string) => {
  if (d === 'easy') return 'bg-green-100 text-green-700';
  if (d === 'medium') return 'bg-yellow-100 text-yellow-700';
  if (d === 'hard') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};
