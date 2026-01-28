export interface TasteQuestion {
  id: string;
  question: Record<string, string>;
  options: {
    id: string;
    label: Record<string, string>;
    tags: { include?: string[]; exclude?: string[] };
  }[];
}

export const tasteQuestions: TasteQuestion[] = [
  {
    id: 'spicy',
    question: {
      ko: '매운 거 먹고 싶어요?',
      en: 'Do you want something spicy?',
      ja: '辛いものが食べたいですか？',
      zh: '想吃辣的吗？',
    },
    options: [
      {
        id: 'yes',
        label: { ko: '매운 거!', en: 'Spicy!', ja: '辛いもの！', zh: '要辣的！' },
        tags: { include: ['spicy'] },
      },
      {
        id: 'no',
        label: { ko: '안 매운 거', en: 'Not spicy', ja: '辛くないもの', zh: '不辣的' },
        tags: { include: ['mild'] },
      },
      {
        id: 'any',
        label: { ko: '상관없어', en: "Don't care", ja: 'どちらでも', zh: '都行' },
        tags: {},
      },
    ],
  },
  {
    id: 'style',
    question: {
      ko: '국물 있는 게 좋아요?',
      en: 'Do you prefer soup-based dishes?',
      ja: 'スープ系がいいですか？',
      zh: '喜欢汤类吗？',
    },
    options: [
      {
        id: 'soupy',
        label: { ko: '국물 있는 거', en: 'Soupy', ja: 'スープ系', zh: '有汤的' },
        tags: { include: ['soupy'] },
      },
      {
        id: 'dry',
        label: { ko: '볶음/구이', en: 'Stir-fry/Grilled', ja: '炒め/焼き', zh: '炒/烤' },
        tags: { include: ['stir_fry', 'grilled'], exclude: ['soupy'] },
      },
      {
        id: 'any',
        label: { ko: '상관없어', en: "Don't care", ja: 'どちらでも', zh: '都行' },
        tags: {},
      },
    ],
  },
  {
    id: 'protein',
    question: {
      ko: '어떤 재료가 끌려요?',
      en: 'What kind of protein do you prefer?',
      ja: 'どんな食材がいいですか？',
      zh: '想吃什么食材？',
    },
    options: [
      {
        id: 'meat',
        label: { ko: '고기', en: 'Meat', ja: '肉', zh: '肉' },
        tags: { include: ['meat'] },
      },
      {
        id: 'seafood',
        label: { ko: '해산물', en: 'Seafood', ja: '海鮮', zh: '海鲜' },
        tags: { include: ['seafood'] },
      },
      {
        id: 'veggie',
        label: { ko: '채소/가벼운 거', en: 'Veggies/Light', ja: '野菜', zh: '蔬菜' },
        tags: { include: ['veggie'] },
      },
      {
        id: 'any',
        label: { ko: '상관없어', en: "Don't care", ja: 'どちらでも', zh: '都行' },
        tags: {},
      },
    ],
  },
  {
    id: 'portion',
    question: {
      ko: '양이 중요한가요?',
      en: 'How much do you want to eat?',
      ja: 'ボリュームは？',
      zh: '分量重要吗？',
    },
    options: [
      {
        id: 'heavy',
        label: { ko: '든든하게!', en: 'Big portion!', ja: 'がっつり！', zh: '吃饱！' },
        tags: { include: ['heavy'] },
      },
      {
        id: 'light',
        label: { ko: '가볍게', en: 'Light', ja: '軽めに', zh: '清淡' },
        tags: { include: ['light'] },
      },
      {
        id: 'any',
        label: { ko: '상관없어', en: "Don't care", ja: 'どちらでも', zh: '都行' },
        tags: {},
      },
    ],
  },
  {
    id: 'time',
    question: {
      ko: '빨리 만들 수 있는 게 좋아요?',
      en: 'Do you want something quick to make?',
      ja: '早く作れるものがいいですか？',
      zh: '想快速做好吗？',
    },
    options: [
      {
        id: 'quick',
        label: { ko: '빨리! (20분 이내)', en: 'Quick! (under 20min)', ja: '早く！（20分以内）', zh: '快！（20分钟内）' },
        tags: { include: ['quick'] },
      },
      {
        id: 'any',
        label: { ko: '상관없어', en: "Don't care", ja: 'どちらでも', zh: '都行' },
        tags: {},
      },
    ],
  },
];

export interface ScoredRecipe {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  tags: string[];
  cooking_time?: number;
  difficulty?: string;
  ingredients?: { name: string; quantity?: string }[];
  score: number;
}

// 답변에 맞는 레시피 점수 계산
export function scoreRecipes(
  recipes: { id: string; title: unknown; description?: unknown; tags?: string[]; cooking_time?: number; difficulty?: string; ingredients?: unknown }[],
  answers: Record<string, string> // questionId -> optionId
): ScoredRecipe[] {
  const scored = recipes.map((recipe) => {
    const tags = recipe.tags || [];
    let score = 0;

    for (const question of tasteQuestions) {
      const answerId = answers[question.id];
      if (!answerId || answerId === 'any') continue;

      const option = question.options.find(o => o.id === answerId);
      if (!option) continue;

      // include 태그가 있으면 점수 부여
      if (option.tags.include) {
        const matched = option.tags.include.some(t => tags.includes(t));
        if (matched) score += 2;
        else score -= 1;
      }

      // exclude 태그가 있으면 감점
      if (option.tags.exclude) {
        const excluded = option.tags.exclude.some(t => tags.includes(t));
        if (excluded) score -= 2;
      }
    }

    return {
      id: recipe.id,
      title: recipe.title as Record<string, string>,
      description: recipe.description as Record<string, string> | undefined,
      tags,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients as { name: string; quantity?: string }[] | undefined,
      score,
    };
  });

  // 점수 순 정렬, 동점이면 랜덤
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  return scored;
}
