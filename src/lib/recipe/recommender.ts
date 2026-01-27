// 레시피 추천 알고리즘

export interface UserIngredient {
  name: string;
  category: string;
  expiryDate: string;
}

export interface RecipeIngredient {
  name: string;
  quantity?: string;
}

export interface Recipe {
  id: string;
  title: { ko?: string; en?: string };
  ingredients: RecipeIngredient[];
  cookingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  sourceUrl?: string;
  [key: string]: unknown;
}

export interface RecommendedRecipe extends Recipe {
  matchRate: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  expiringIngredientCount: number;
  score: number;
}

// 재료명 정규화 (비교용)
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318Fa-z0-9]/g, '');
}

// 재료 매칭 확인
function isIngredientMatch(userIngredient: string, recipeIngredient: string): boolean {
  const normalizedUser = normalizeIngredientName(userIngredient);
  const normalizedRecipe = normalizeIngredientName(recipeIngredient);

  // 정확히 일치
  if (normalizedUser === normalizedRecipe) return true;

  // 포함 관계
  if (normalizedUser.includes(normalizedRecipe) || normalizedRecipe.includes(normalizedUser)) {
    return true;
  }

  // 유사어 매칭
  const synonyms: Record<string, string[]> = {
    '돼지고기': ['삼겹살', '목살', '앞다리살', '뒷다리살', '안심', '등심'],
    '소고기': ['쇠고기', '한우', '차돌박이', '등심', '안심', '불고기'],
    '닭고기': ['닭', '닭가슴살', '닭다리', '닭날개', '닭안심'],
    '양파': ['양파', '자색양파', '빨간양파'],
    '파': ['대파', '쪽파', '실파', '파'],
    '고추': ['청양고추', '홍고추', '풋고추', '고추'],
    '간장': ['진간장', '국간장', '양조간장', '간장'],
    '된장': ['된장', '재래된장', '한식된장'],
    '고추장': ['고추장', '태양초고추장'],
  };

  for (const [base, variants] of Object.entries(synonyms)) {
    const normalizedBase = normalizeIngredientName(base);
    const normalizedVariants = variants.map(normalizeIngredientName);

    const userMatches = normalizedUser === normalizedBase || normalizedVariants.includes(normalizedUser);
    const recipeMatches = normalizedRecipe === normalizedBase || normalizedVariants.includes(normalizedRecipe);

    if (userMatches && recipeMatches) return true;
  }

  return false;
}

// 유통기한 임박 재료 확인
function isExpiringSoon(expiryDate: string, days: number = 3): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

// 레시피 추천
export function recommendRecipes(
  userIngredients: UserIngredient[],
  recipes: Recipe[],
  options: {
    minMatchRate?: number;
    prioritizeExpiring?: boolean;
    maxResults?: number;
  } = {}
): RecommendedRecipe[] {
  const {
    minMatchRate = 0,
    prioritizeExpiring = true,
    maxResults = 20,
  } = options;

  const userIngredientNames = userIngredients.map(i => i.name);
  const expiringIngredients = userIngredients
    .filter(i => isExpiringSoon(i.expiryDate))
    .map(i => i.name);

  const recommendedRecipes: RecommendedRecipe[] = recipes.map(recipe => {
    const recipeIngredients = recipe.ingredients || [];
    const totalIngredients = recipeIngredients.length;

    if (totalIngredients === 0) {
      return {
        ...recipe,
        matchRate: 0,
        matchedIngredients: [],
        missingIngredients: [],
        expiringIngredientCount: 0,
        score: 0,
      };
    }

    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];
    let expiringIngredientCount = 0;

    recipeIngredients.forEach(ri => {
      const isMatched = userIngredientNames.some(ui => isIngredientMatch(ui, ri.name));

      if (isMatched) {
        matchedIngredients.push(ri.name);

        // 유통기한 임박 재료 체크
        if (expiringIngredients.some(ei => isIngredientMatch(ei, ri.name))) {
          expiringIngredientCount++;
        }
      } else {
        missingIngredients.push(ri.name);
      }
    });

    const matchRate = Math.round((matchedIngredients.length / totalIngredients) * 100);

    // 점수 계산 (매칭률 + 유통기한 임박 재료 보너스)
    let score = matchRate;
    if (prioritizeExpiring && expiringIngredientCount > 0) {
      score += expiringIngredientCount * 10; // 임박 재료당 10점 보너스
    }

    // 난이도에 따른 보너스 (쉬운 레시피 우대)
    if (recipe.difficulty === 'easy') score += 5;
    else if (recipe.difficulty === 'medium') score += 2;

    return {
      ...recipe,
      matchRate,
      matchedIngredients,
      missingIngredients,
      expiringIngredientCount,
      score,
    };
  });

  // 필터링 및 정렬
  return recommendedRecipes
    .filter(r => r.matchRate >= minMatchRate)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// 랜덤 레시피 선택
export function getRandomRecipe(recipes: Recipe[]): Recipe | null {
  if (recipes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * recipes.length);
  return recipes[randomIndex];
}

// 재료 기반 검색어 추천
export function suggestSearchKeywords(ingredients: UserIngredient[]): string[] {
  const categoryKeywords: Record<string, string[]> = {
    vegetables: ['볶음', '무침', '전', '샐러드'],
    meat: ['구이', '찌개', '조림', '볶음'],
    seafood: ['조림', '구이', '찌개', '탕'],
    dairy: ['스크램블', '오믈렛', '그라탕'],
    grains: ['볶음밥', '비빔밥', '죽'],
  };

  const keywords = new Set<string>();

  // 재료명 추가
  ingredients.slice(0, 5).forEach(i => keywords.add(i.name));

  // 카테고리 기반 요리법 추가
  ingredients.forEach(i => {
    const categoryRecipes = categoryKeywords[i.category];
    if (categoryRecipes) {
      categoryRecipes.forEach(r => keywords.add(`${i.name} ${r}`));
    }
  });

  return Array.from(keywords).slice(0, 10);
}
