import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { callGemini, parseJsonFromText } from '../_shared/gemini.ts';
import type { Ingredient, ShoppingRecommendation, ScanEvent } from '../_shared/types.ts';

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

    // Fetch user's current ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('name, category, quantity, unit, expiry_date, purchase_date')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true });

    if (ingredientsError) throw ingredientsError;

    // Fetch purchase history from event_logs
    const { data: scanEvents, error: scansError } = await supabase
      .from('event_logs')
      .select('metadata, created_at')
      .eq('user_id', user.id)
      .eq('event_type', 'receipt_scan')
      .order('created_at', { ascending: false })
      .limit(10);

    if (scansError) throw scansError;

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          recommendations: getDefaultRecommendations(ingredients || []),
          source: 'default',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recommendations = await getAIRecommendations(
      ingredients || [],
      scanEvents || []
    );

    return new Response(
      JSON.stringify({ recommendations, source: 'ai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to get recommendations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAIRecommendations(
  ingredients: Ingredient[],
  scanEvents: ScanEvent[]
): Promise<ShoppingRecommendation[]> {
  const currentIngredients = ingredients.map((i: Ingredient) => ({
    name: i.name,
    category: i.category,
    daysUntilExpiry: Math.ceil(
      (new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
  }));

  const purchaseHistory: Record<string, number> = {};
  for (const event of scanEvents) {
    const items = (event.metadata as Record<string, unknown>)?.parsed_items as Array<{ name: string }> | null;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.name) {
          purchaseHistory[item.name] = (purchaseHistory[item.name] || 0) + 1;
        }
      }
    }
  }

  const frequentItems = Object.entries(purchaseHistory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const prompt = `당신은 스마트 장보기 도우미입니다.

사용자의 현재 냉장고 재료:
${JSON.stringify(currentIngredients, null, 2)}

자주 구매하는 재료 (구매 횟수):
${JSON.stringify(frequentItems, null, 2)}

위 정보를 바탕으로 사용자에게 필요할 것 같은 장보기 목록을 추천해주세요.

추천 기준:
1. 유통기한이 임박한 재료(3일 이내)는 대체 재료 필요
2. 자주 구매하는데 현재 없는 재료
3. 균형 잡힌 식단을 위한 기본 재료
4. 계절에 맞는 신선 재료

JSON 배열로 응답:
[
  {
    "name": "재료명",
    "quantity": 숫자,
    "unit": "g" | "kg" | "ml" | "L" | "ea" | "pack" | "bottle" | "box" | "bunch",
    "category": "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "condiments" | "grains" | "beverages" | "snacks" | "etc",
    "reason": "추천 이유"
  }
]

5~8개 추천. JSON만 응답.`;

  try {
    const text = await callGemini(prompt, { temperature: 0.7, maxTokens: 2048 });

    if (!text) return getDefaultRecommendations(ingredients);

    const parsed = parseJsonFromText(text);
    if (!Array.isArray(parsed)) return getDefaultRecommendations(ingredients);

    return parsed
      .filter((item: Record<string, unknown>) => item?.name && typeof item.name === 'string')
      .map((item: Record<string, unknown>): ShoppingRecommendation => ({
        name: item.name as string,
        quantity: (item.quantity as number) || 1,
        unit: (item.unit as string) || 'ea',
        category: (item.category as string) || 'etc',
        reason: (item.reason as string) || '',
      }));
  } catch {
    return getDefaultRecommendations(ingredients);
  }
}

function getDefaultRecommendations(ingredients: Ingredient[]): ShoppingRecommendation[] {
  const recommendations: ShoppingRecommendation[] = [];
  const existingCategories = new Set(ingredients.map((i: Ingredient) => i.category));

  const essentials = [
    { name: '계란', category: 'dairy', condition: !ingredients.some((i: Ingredient) => i.name?.includes('계란') || i.name?.includes('달걀')) },
    { name: '우유', category: 'dairy', condition: !ingredients.some((i: Ingredient) => i.name?.includes('우유')) },
    { name: '양파', category: 'vegetables', condition: !ingredients.some((i: Ingredient) => i.name?.includes('양파')) },
    { name: '대파', category: 'vegetables', condition: !ingredients.some((i: Ingredient) => i.name?.includes('파')) },
    { name: '마늘', category: 'condiments', condition: !ingredients.some((i: Ingredient) => i.name?.includes('마늘')) },
    { name: '쌀', category: 'grains', condition: !ingredients.some((i: Ingredient) => i.name?.includes('쌀')) },
  ];

  for (const item of essentials) {
    if (item.condition && recommendations.length < 6) {
      recommendations.push({
        name: item.name,
        quantity: 1,
        unit: 'ea',
        category: item.category,
        reason: '필수 식재료',
      });
    }
  }

  const categoryDefaults = [
    { category: 'vegetables', name: '당근', reason: '채소류 보충' },
    { category: 'fruits', name: '사과', reason: '과일류 보충' },
    { category: 'meat', name: '닭가슴살', reason: '단백질 보충' },
    { category: 'seafood', name: '고등어', reason: '해산물 보충' },
  ];

  for (const item of categoryDefaults) {
    if (!existingCategories.has(item.category) && recommendations.length < 8) {
      recommendations.push({
        name: item.name,
        quantity: 1,
        unit: 'ea',
        category: item.category,
        reason: item.reason,
      });
    }
  }

  return recommendations;
}
