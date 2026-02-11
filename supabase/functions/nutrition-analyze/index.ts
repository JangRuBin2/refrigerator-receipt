import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { callGemini, parseJsonFromText } from '../_shared/gemini.ts';
import type { Ingredient, Nutrition, IngredientNutrition, CategoryBalance, NutritionReport } from '../_shared/types.ts';

const CATEGORY_NUTRITION: Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number }> = {
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

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for period parameter (POST body or GET query)
    let period: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        period = body.period || null;
      } catch { /* no body */ }
    } else {
      const url = new URL(req.url);
      period = url.searchParams.get('period');
    }

    // Build query - filter by purchase_date if period is specified
    let query = supabase
      .from('ingredients')
      .select('name, category, quantity, unit')
      .eq('user_id', user.id);

    if (period === 'week' || period === 'month') {
      const now = new Date();
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }
      query = query.gte('purchase_date', startDate.toISOString().split('T')[0]);
    }

    const { data: ingredients, error } = await query;

    if (error) throw error;

    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({
          report: {
            totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
            ingredients: [],
            categoryBalance: [],
            score: 0,
            recommendations: ['냉장고에 재료를 추가해주세요.'],
            period: period || 'current',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const report = await analyzeNutrition(ingredients, period);

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to analyze nutrition' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeNutrition(ingredients: Ingredient[], period: string | null): Promise<NutritionReport> {
  // Category count
  const categoryCount: Record<string, number> = {};
  for (const ing of ingredients) {
    categoryCount[ing.category] = (categoryCount[ing.category] || 0) + 1;
  }

  const totalCount = ingredients.length;

  // Category balance
  const categoryBalance = Object.entries(categoryCount).map(([category, count]) => {
    const percentage = Math.round((count / totalCount) * 100);
    const recommended = RECOMMENDED_BALANCE[category] || { min: 0, max: 100 };
    let status: 'good' | 'low' | 'high' = 'good';
    if (percentage < recommended.min) status = 'low';
    else if (percentage > recommended.max) status = 'high';
    return { category, count, percentage, status };
  }).sort((a, b) => b.percentage - a.percentage);

  // Nutrition calculation
  const ingredientNutrition: IngredientNutrition[] = ingredients.map((ing: Ingredient) => {
    const baseNutrition = CATEGORY_NUTRITION[ing.category] || CATEGORY_NUTRITION.etc;
    let multiplier = 1;
    if (ing.unit === 'kg') multiplier = 10;
    else if (ing.unit === 'g') multiplier = 0.01;
    else if (ing.unit === 'L') multiplier = 10;
    else if (ing.unit === 'ml') multiplier = 0.01;

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

  // Total nutrition
  const totalNutrition = ingredientNutrition.reduce((acc: Nutrition, ing: IngredientNutrition) => ({
    calories: acc.calories + ing.nutrition.calories,
    protein: acc.protein + ing.nutrition.protein,
    carbs: acc.carbs + ing.nutrition.carbs,
    fat: acc.fat + ing.nutrition.fat,
    fiber: acc.fiber + ing.nutrition.fiber,
    sugar: acc.sugar + ing.nutrition.sugar,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });

  totalNutrition.protein = Math.round(totalNutrition.protein * 10) / 10;
  totalNutrition.carbs = Math.round(totalNutrition.carbs * 10) / 10;
  totalNutrition.fat = Math.round(totalNutrition.fat * 10) / 10;
  totalNutrition.fiber = Math.round(totalNutrition.fiber * 10) / 10;
  totalNutrition.sugar = Math.round(totalNutrition.sugar * 10) / 10;

  // Score
  const goodCategories = categoryBalance.filter(c => c.status === 'good').length;
  const hasVegetables = (categoryCount.vegetables || 0) > 0;
  const hasProtein = (categoryCount.meat || 0) + (categoryCount.seafood || 0) + (categoryCount.dairy || 0) > 0;
  const hasGrains = (categoryCount.grains || 0) > 0;

  let score = Math.round((goodCategories / Object.keys(RECOMMENDED_BALANCE).length) * 50);
  if (hasVegetables) score += 20;
  if (hasProtein) score += 15;
  if (hasGrains) score += 15;
  score = Math.min(100, score);

  // AI recommendations
  const recommendations = await getAIRecommendations(ingredients, categoryBalance, totalNutrition);

  return {
    totalNutrition,
    ingredients: ingredientNutrition,
    categoryBalance,
    score,
    recommendations,
    period: period || 'current',
  };
}

async function getAIRecommendations(
  ingredients: Ingredient[],
  categoryBalance: CategoryBalance[],
  nutrition: Nutrition
): Promise<string[]> {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

  if (!apiKey) {
    return getDefaultRecommendations(categoryBalance);
  }

  const prompt = `당신은 영양사입니다. 사용자의 냉장고 재료와 영양 분석 결과를 보고 간단한 식단 개선 추천을 해주세요.

현재 냉장고 재료:
${ingredients.map((i: Ingredient) => `- ${i.name} (${i.category})`).join('\n')}

카테고리별 비율:
${categoryBalance.map((c: CategoryBalance) => `- ${c.category}: ${c.percentage}% (${c.status === 'good' ? '적정' : c.status === 'low' ? '부족' : '과다'})`).join('\n')}

총 영양 성분:
- 칼로리: ${nutrition.calories}kcal
- 단백질: ${nutrition.protein}g
- 탄수화물: ${nutrition.carbs}g
- 지방: ${nutrition.fat}g

3~4개의 짧은 추천을 JSON 배열로 응답. 각 추천은 한 문장.
예: ["채소류를 더 구매하세요", "단백질 섭취를 늘리세요"]

JSON 배열만 응답:`;

  try {
    const text = await callGemini(prompt, { temperature: 0.7, maxTokens: 512 });

    if (!text) return getDefaultRecommendations(categoryBalance);

    const parsed = parseJsonFromText(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((item: unknown) => typeof item === 'string').slice(0, 4);
    }

    return getDefaultRecommendations(categoryBalance);
  } catch {
    return getDefaultRecommendations(categoryBalance);
  }
}

function getDefaultRecommendations(categoryBalance: CategoryBalance[]): string[] {
  const recommendations: string[] = [];

  const lowCategories = categoryBalance.filter((c: CategoryBalance) => c.status === 'low');
  const highCategories = categoryBalance.filter((c: CategoryBalance) => c.status === 'high');

  const categoryNames: Record<string, string> = {
    vegetables: '채소류', fruits: '과일류', meat: '육류',
    seafood: '해산물', dairy: '유제품', grains: '곡류',
  };

  for (const cat of lowCategories.slice(0, 2)) {
    if (categoryNames[cat.category]) {
      recommendations.push(`${categoryNames[cat.category]}를 더 섭취하세요.`);
    }
  }

  if (highCategories.some((c: CategoryBalance) => c.category === 'snacks')) {
    recommendations.push('간식 섭취를 줄이고 건강한 대안을 찾아보세요.');
  }

  if (!categoryBalance.some((c: CategoryBalance) => c.category === 'vegetables')) {
    recommendations.push('신선한 채소를 식단에 추가하세요.');
  }

  if (!categoryBalance.some((c: CategoryBalance) => ['meat', 'seafood', 'dairy'].includes(c.category))) {
    recommendations.push('단백질 공급원을 추가하세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('현재 영양 균형이 좋습니다! 이 상태를 유지하세요.');
  }

  return recommendations.slice(0, 4);
}
