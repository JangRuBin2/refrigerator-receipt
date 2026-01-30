import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface IngredientNutrition {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  nutrition: NutritionData;
}

interface CategoryBalance {
  category: string;
  count: number;
  percentage: number;
  status: 'good' | 'low' | 'high';
}

interface NutritionReport {
  totalNutrition: NutritionData;
  ingredients: IngredientNutrition[];
  categoryBalance: CategoryBalance[];
  score: number;
  recommendations: string[];
  period: string;
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

// 카테고리별 기본 영양 정보 (100g 기준 평균)
const CATEGORY_NUTRITION: Record<string, NutritionData> = {
  vegetables: { calories: 25, protein: 2, carbs: 5, fat: 0.3, fiber: 2, sugar: 2 },
  fruits: { calories: 50, protein: 0.5, carbs: 13, fat: 0.2, fiber: 2, sugar: 10 },
  meat: { calories: 200, protein: 25, carbs: 0, fat: 12, fiber: 0, sugar: 0 },
  seafood: { calories: 100, protein: 20, carbs: 0, fat: 2, fiber: 0, sugar: 0 },
  dairy: { calories: 80, protein: 5, carbs: 6, fat: 4, fiber: 0, sugar: 5 },
  condiments: { calories: 50, protein: 1, carbs: 10, fat: 0.5, fiber: 0, sugar: 3 },
  grains: { calories: 350, protein: 10, carbs: 70, fat: 2, fiber: 5, sugar: 1 },
  beverages: { calories: 40, protein: 0, carbs: 10, fat: 0, fiber: 0, sugar: 8 },
  snacks: { calories: 450, protein: 5, carbs: 60, fat: 20, fiber: 2, sugar: 25 },
  etc: { calories: 100, protein: 3, carbs: 15, fat: 3, fiber: 1, sugar: 5 },
};

// 권장 카테고리 비율
const RECOMMENDED_BALANCE: Record<string, { min: number; max: number }> = {
  vegetables: { min: 25, max: 40 },
  fruits: { min: 10, max: 20 },
  meat: { min: 10, max: 20 },
  seafood: { min: 5, max: 15 },
  dairy: { min: 10, max: 20 },
  grains: { min: 15, max: 25 },
  condiments: { min: 0, max: 10 },
  beverages: { min: 0, max: 10 },
  snacks: { min: 0, max: 5 },
  etc: { min: 0, max: 10 },
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 현재 재료 조회
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('name, category, quantity, unit')
      .eq('user_id', user.id);

    if (error) throw error;

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({
        report: {
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
          ingredients: [],
          categoryBalance: [],
          score: 0,
          recommendations: ['냉장고에 재료를 추가해주세요.'],
          period: 'current',
        },
      });
    }

    // 영양 분석 수행
    const report = await analyzeNutrition(ingredients);

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Nutrition analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze nutrition' },
      { status: 500 }
    );
  }
}

async function analyzeNutrition(
  ingredients: Array<{ name: string; category: string; quantity: number; unit: string }>
): Promise<NutritionReport> {
  // 카테고리별 재료 개수
  const categoryCount: Record<string, number> = {};
  for (const ing of ingredients) {
    categoryCount[ing.category] = (categoryCount[ing.category] || 0) + 1;
  }

  const totalCount = ingredients.length;

  // 카테고리 균형 분석
  const categoryBalance: CategoryBalance[] = Object.entries(categoryCount).map(([category, count]) => {
    const percentage = Math.round((count / totalCount) * 100);
    const recommended = RECOMMENDED_BALANCE[category] || { min: 0, max: 100 };
    let status: 'good' | 'low' | 'high' = 'good';

    if (percentage < recommended.min) {
      status = 'low';
    } else if (percentage > recommended.max) {
      status = 'high';
    }

    return { category, count, percentage, status };
  }).sort((a, b) => b.percentage - a.percentage);

  // 영양 성분 계산
  const ingredientNutrition: IngredientNutrition[] = ingredients.map(ing => {
    const baseNutrition = CATEGORY_NUTRITION[ing.category] || CATEGORY_NUTRITION.etc;

    // 수량 기반 영양 계산 (단위에 따라 조정)
    let multiplier = 1;
    if (ing.unit === 'kg') multiplier = 10;
    else if (ing.unit === 'g') multiplier = 0.01;
    else if (ing.unit === 'L') multiplier = 10;
    else if (ing.unit === 'ml') multiplier = 0.01;
    else multiplier = 1; // ea, pack 등은 100g 기준으로 가정

    const quantity = ing.quantity * multiplier;

    return {
      name: ing.name,
      category: ing.category,
      quantity: ing.quantity,
      unit: ing.unit,
      nutrition: {
        calories: Math.round(baseNutrition.calories * quantity),
        protein: Math.round(baseNutrition.protein * quantity * 10) / 10,
        carbs: Math.round(baseNutrition.carbs * quantity * 10) / 10,
        fat: Math.round(baseNutrition.fat * quantity * 10) / 10,
        fiber: Math.round(baseNutrition.fiber * quantity * 10) / 10,
        sugar: Math.round(baseNutrition.sugar * quantity * 10) / 10,
      },
    };
  });

  // 총 영양 성분
  const totalNutrition: NutritionData = ingredientNutrition.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.nutrition.calories,
      protein: acc.protein + ing.nutrition.protein,
      carbs: acc.carbs + ing.nutrition.carbs,
      fat: acc.fat + ing.nutrition.fat,
      fiber: acc.fiber + ing.nutrition.fiber,
      sugar: acc.sugar + ing.nutrition.sugar,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  // 반올림
  totalNutrition.protein = Math.round(totalNutrition.protein * 10) / 10;
  totalNutrition.carbs = Math.round(totalNutrition.carbs * 10) / 10;
  totalNutrition.fat = Math.round(totalNutrition.fat * 10) / 10;
  totalNutrition.fiber = Math.round(totalNutrition.fiber * 10) / 10;
  totalNutrition.sugar = Math.round(totalNutrition.sugar * 10) / 10;

  // 영양 점수 계산 (균형 기반)
  const goodCategories = categoryBalance.filter(c => c.status === 'good').length;
  const hasVegetables = categoryCount.vegetables > 0;
  const hasProtein = (categoryCount.meat || 0) + (categoryCount.seafood || 0) + (categoryCount.dairy || 0) > 0;
  const hasGrains = categoryCount.grains > 0;

  let score = Math.round((goodCategories / Object.keys(RECOMMENDED_BALANCE).length) * 50);
  if (hasVegetables) score += 20;
  if (hasProtein) score += 15;
  if (hasGrains) score += 15;
  score = Math.min(100, score);

  // AI 기반 추천 생성
  const recommendations = await getAIRecommendations(ingredients, categoryBalance, totalNutrition);

  return {
    totalNutrition,
    ingredients: ingredientNutrition,
    categoryBalance,
    score,
    recommendations,
    period: 'current',
  };
}

async function getAIRecommendations(
  ingredients: Array<{ name: string; category: string }>,
  categoryBalance: CategoryBalance[],
  nutrition: NutritionData
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    // API 키 없으면 기본 추천
    return getDefaultRecommendations(categoryBalance);
  }

  const prompt = `당신은 영양사입니다. 사용자의 냉장고 재료와 영양 분석 결과를 보고 간단한 식단 개선 추천을 해주세요.

현재 냉장고 재료:
${ingredients.map(i => `- ${i.name} (${i.category})`).join('\n')}

카테고리별 비율:
${categoryBalance.map(c => `- ${c.category}: ${c.percentage}% (${c.status === 'good' ? '적정' : c.status === 'low' ? '부족' : '과다'})`).join('\n')}

총 영양 성분 (모든 재료 합산):
- 칼로리: ${nutrition.calories}kcal
- 단백질: ${nutrition.protein}g
- 탄수화물: ${nutrition.carbs}g
- 지방: ${nutrition.fat}g

3~4개의 짧은 추천을 JSON 배열로 응답해주세요. 각 추천은 한 문장으로 작성하세요.
예: ["채소류를 더 구매하세요", "단백질 섭취를 늘리세요"]

JSON 배열만 응답하세요:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      return getDefaultRecommendations(categoryBalance);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return getDefaultRecommendations(categoryBalance);
    }

    // JSON 파싱
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const arrayStart = jsonStr.indexOf('[');
    const arrayEnd = jsonStr.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1) {
      jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === 'string').slice(0, 4);
    }

    return getDefaultRecommendations(categoryBalance);
  } catch (error) {
    console.error('AI recommendation error:', error);
    return getDefaultRecommendations(categoryBalance);
  }
}

function getDefaultRecommendations(categoryBalance: CategoryBalance[]): string[] {
  const recommendations: string[] = [];

  const lowCategories = categoryBalance.filter(c => c.status === 'low');
  const highCategories = categoryBalance.filter(c => c.status === 'high');

  if (lowCategories.length > 0) {
    const categoryNames: Record<string, string> = {
      vegetables: '채소류',
      fruits: '과일류',
      meat: '육류',
      seafood: '해산물',
      dairy: '유제품',
      grains: '곡류',
    };

    for (const cat of lowCategories.slice(0, 2)) {
      if (categoryNames[cat.category]) {
        recommendations.push(`${categoryNames[cat.category]}를 더 섭취하세요.`);
      }
    }
  }

  if (highCategories.some(c => c.category === 'snacks')) {
    recommendations.push('간식 섭취를 줄이고 건강한 대안을 찾아보세요.');
  }

  if (!categoryBalance.some(c => c.category === 'vegetables')) {
    recommendations.push('신선한 채소를 식단에 추가하세요.');
  }

  if (!categoryBalance.some(c => ['meat', 'seafood', 'dairy'].includes(c.category))) {
    recommendations.push('단백질 공급원을 추가하세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('현재 영양 균형이 좋습니다! 이 상태를 유지하세요.');
  }

  return recommendations.slice(0, 4);
}
