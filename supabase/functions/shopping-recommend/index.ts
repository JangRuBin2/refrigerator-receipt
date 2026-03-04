import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
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
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // 클라이언트에서 보낸 재료 목록도 받기 (DB 조회 실패 시 폴백용)
    const body = await req.json().catch(() => ({}));
    const clientIngredients: string[] = (body as { ingredients?: string[] }).ingredients || [];

    // DB에서 유저의 실제 냉장고 재료 조회
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('name, category, quantity, unit, expiry_date, purchase_date')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true });

    if (ingredientsError) throw ingredientsError;

    // DB 재료가 없으면 클라이언트에서 보낸 재료 사용
    const ingredientList: Ingredient[] = (ingredients && ingredients.length > 0)
      ? ingredients
      : clientIngredients.map((name) => ({
          name,
          category: 'etc',
          quantity: 1,
          unit: 'ea',
          expiry_date: '',
          purchase_date: '',
        }));

    // 냉장고에 재료가 하나도 없는 경우
    if (ingredientList.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [],
          source: 'empty',
          message: '냉장고에 등록된 재료가 없습니다. 재료를 먼저 등록해주세요.',
        }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // 구매 이력 조회
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
          error: 'AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        }),
        { status: 503, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const recommendations = await getAIRecommendations(
      ingredientList,
      scanEvents || []
    );

    return new Response(
      JSON.stringify({ recommendations, source: 'ai' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'AI 추천을 가져오지 못했습니다. 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
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
    daysUntilExpiry: i.expiry_date
      ? Math.ceil(
          (new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null,
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

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const seasonMap: Record<number, string> = { 0: '겨울', 1: '겨울', 2: '봄', 3: '봄', 4: '봄', 5: '여름', 6: '여름', 7: '여름', 8: '가을', 9: '가을', 10: '가을', 11: '겨울' };
  const season = seasonMap[today.getMonth()];

  const prompt = `당신은 스마트 장보기 도우미입니다.

오늘 날짜: ${dateStr} (${season})

사용자의 현재 냉장고 재료:
${JSON.stringify(currentIngredients, null, 2)}

자주 구매하는 재료 (구매 횟수):
${JSON.stringify(frequentItems, null, 2)}

위 정보를 바탕으로 사용자에게 필요할 것 같은 장보기 목록을 추천해주세요.

추천 기준:
1. 현재 냉장고 재료와 함께 사용하면 좋은 식재료
2. 유통기한이 임박한 재료(3일 이내)가 있으면 대체할 수 있는 재료
3. 자주 구매하는데 현재 냉장고에 없는 재료
4. ${season}철 제철 식재료 우선 추천
5. 현재 재료로 만들 수 있는 요리에 부족한 재료

JSON 배열로 응답:
[
  {
    "name": "재료명",
    "quantity": 숫자,
    "unit": "g" | "kg" | "ml" | "L" | "ea" | "pack" | "bottle" | "box" | "bunch",
    "category": "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "condiments" | "grains" | "beverages" | "snacks" | "etc",
    "reason": "추천 이유 (현재 냉장고 재료와의 연관성 포함)"
  }
]

5~8개 추천. JSON만 응답.`;

  const text = await callGemini(prompt, { temperature: 0.8, maxTokens: 2048 });

  if (!text) {
    throw new Error('AI 응답이 비어있습니다.');
  }

  const parsed = parseJsonFromText(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI 응답을 파싱할 수 없습니다.');
  }

  return parsed
    .filter((item: Record<string, unknown>) => item?.name && typeof item.name === 'string')
    .map((item: Record<string, unknown>): ShoppingRecommendation => ({
      name: item.name as string,
      quantity: (item.quantity as number) || 1,
      unit: (item.unit as string) || 'ea',
      category: (item.category as string) || 'etc',
      reason: (item.reason as string) || '',
    }));
}
