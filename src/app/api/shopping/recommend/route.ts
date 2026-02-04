import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Category, Unit } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RecommendedItem {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  reason: string;
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

// GET: AI 기반 장보기 추천
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 현재 재료 조회
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('name, category, quantity, unit, expiry_date, purchase_date')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true });

    if (ingredientsError) throw ingredientsError;

    // 과거 스캔 기록에서 자주 구매한 재료 분석
    const { data: scans, error: scansError } = await supabase
      .from('receipt_scans')
      .select('parsed_items, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (scansError) throw scansError;

    // Gemini API 키 확인
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      // API 키가 없으면 기본 추천
      return NextResponse.json({
        recommendations: getDefaultRecommendations(ingredients || []),
        source: 'default',
      });
    }

    // AI 기반 추천
    const recommendations = await getAIRecommendations(
      apiKey,
      ingredients || [],
      scans || []
    );

    return NextResponse.json({
      recommendations,
      source: 'ai',
    });
  } catch (error) {
    console.error('Shopping recommend error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

async function getAIRecommendations(
  apiKey: string,
  ingredients: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    expiry_date: string;
    purchase_date: string;
  }>,
  scans: Array<{
    parsed_items: unknown;
    created_at: string;
  }>
): Promise<RecommendedItem[]> {
  // 현재 냉장고 재료 정리
  const currentIngredients = ingredients.map(i => ({
    name: i.name,
    category: i.category,
    daysUntilExpiry: Math.ceil(
      (new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
  }));

  // 과거 구매 기록 분석
  const purchaseHistory: Record<string, number> = {};
  for (const scan of scans) {
    const items = scan.parsed_items as Array<{ name: string }> | null;
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

JSON 배열로 응답해주세요:
[
  {
    "name": "재료명",
    "quantity": 숫자,
    "unit": "g" | "kg" | "ml" | "L" | "ea" | "pack" | "bottle" | "box" | "bunch",
    "category": "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "condiments" | "grains" | "beverages" | "snacks" | "etc",
    "reason": "추천 이유 (한 문장)"
  }
]

5~8개 정도 추천해주세요. JSON만 응답하세요.`;

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
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return getDefaultRecommendations(ingredients);
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

    if (!Array.isArray(parsed)) {
      return getDefaultRecommendations(ingredients);
    }

    return parsed.filter(item =>
      item && typeof item.name === 'string' && item.name.length > 0
    ).map(item => ({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'ea',
      category: item.category || 'etc',
      reason: item.reason || '',
    }));
  } catch (error) {
    console.error('AI recommendation error:', error);
    return getDefaultRecommendations(ingredients);
  }
}

function getDefaultRecommendations(
  ingredients: Array<{ name: string; category: string; expiry_date?: string }>
): RecommendedItem[] {
  const recommendations: RecommendedItem[] = [];
  const existingCategories = new Set(ingredients.map(i => i.category));

  // 필수 재료 추천
  const essentials: Array<{
    name: string;
    category: Category;
    condition: boolean;
  }> = [
    { name: '계란', category: 'dairy', condition: !ingredients.some(i => i.name.includes('계란') || i.name.includes('달걀')) },
    { name: '우유', category: 'dairy', condition: !ingredients.some(i => i.name.includes('우유')) },
    { name: '양파', category: 'vegetables', condition: !ingredients.some(i => i.name.includes('양파')) },
    { name: '대파', category: 'vegetables', condition: !ingredients.some(i => i.name.includes('파')) },
    { name: '마늘', category: 'condiments', condition: !ingredients.some(i => i.name.includes('마늘')) },
    { name: '쌀', category: 'grains', condition: !ingredients.some(i => i.name.includes('쌀')) },
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

  // 부족한 카테고리 추천
  const categoryDefaults: Array<{ category: Category; name: string; reason: string }> = [
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
