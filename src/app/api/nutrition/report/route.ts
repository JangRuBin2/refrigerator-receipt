import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface PeriodReport {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  totalItems: number;
  categoryDistribution: Record<string, number>;
  estimatedNutrition: NutritionData;
  purchaseHistory: Array<{
    date: string;
    items: Array<{ name: string; category?: string }>;
  }>;
  trends: {
    mostPurchased: string[];
    categoryTrend: Array<{ category: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  };
  recommendations: string[];
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as 'week' | 'month';

    // 기간 계산
    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // 영수증 스캔 기록 조회
    const { data: scans, error: scanError } = await supabase
      .from('receipt_scans')
      .select('created_at, parsed_items')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (scanError) {
      console.error('Scan fetch error:', scanError);
    }

    // 재료 추가 기록 조회 (ingredients 테이블에서 기간 내 추가된 것)
    const { data: ingredients, error: ingError } = await supabase
      .from('ingredients')
      .select('name, category, quantity, unit, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (ingError) {
      console.error('Ingredients fetch error:', ingError);
    }

    // 데이터 집계
    const categoryCount: Record<string, number> = {};
    const itemCount: Record<string, number> = {};
    const purchaseHistory: PeriodReport['purchaseHistory'] = [];

    // 영수증 스캔 데이터 처리
    if (scans && scans.length > 0) {
      for (const scan of scans) {
        const items = (scan.parsed_items as Array<{ name: string; category?: string }>) || [];
        const date = new Date(scan.created_at).toISOString().split('T')[0];

        if (items.length > 0) {
          purchaseHistory.push({ date, items });

          for (const item of items) {
            const category = item.category || 'etc';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
            itemCount[item.name] = (itemCount[item.name] || 0) + 1;
          }
        }
      }
    }

    // 재료 추가 데이터 처리
    if (ingredients && ingredients.length > 0) {
      const groupedByDate: Record<string, Array<{ name: string; category?: string }>> = {};

      for (const ing of ingredients) {
        const date = new Date(ing.created_at).toISOString().split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push({ name: ing.name, category: ing.category });

        categoryCount[ing.category] = (categoryCount[ing.category] || 0) + 1;
        itemCount[ing.name] = (itemCount[ing.name] || 0) + 1;
      }

      // 기존 purchaseHistory와 병합
      for (const [date, items] of Object.entries(groupedByDate)) {
        const existing = purchaseHistory.find(h => h.date === date);
        if (existing) {
          existing.items.push(...items);
        } else {
          purchaseHistory.push({ date, items });
        }
      }

      // 날짜순 정렬
      purchaseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // 총 아이템 수
    const totalItems = Object.values(categoryCount).reduce((a, b) => a + b, 0);

    // 예상 영양 성분 계산
    const estimatedNutrition: NutritionData = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
    for (const [category, count] of Object.entries(categoryCount)) {
      const baseNutrition = CATEGORY_NUTRITION[category] || CATEGORY_NUTRITION.etc;
      // 각 아이템을 평균 200g으로 가정
      const multiplier = count * 2;
      estimatedNutrition.calories += baseNutrition.calories * multiplier;
      estimatedNutrition.protein += baseNutrition.protein * multiplier;
      estimatedNutrition.carbs += baseNutrition.carbs * multiplier;
      estimatedNutrition.fat += baseNutrition.fat * multiplier;
      estimatedNutrition.fiber += baseNutrition.fiber * multiplier;
      estimatedNutrition.sugar += baseNutrition.sugar * multiplier;
    }

    // 반올림
    estimatedNutrition.calories = Math.round(estimatedNutrition.calories);
    estimatedNutrition.protein = Math.round(estimatedNutrition.protein * 10) / 10;
    estimatedNutrition.carbs = Math.round(estimatedNutrition.carbs * 10) / 10;
    estimatedNutrition.fat = Math.round(estimatedNutrition.fat * 10) / 10;
    estimatedNutrition.fiber = Math.round(estimatedNutrition.fiber * 10) / 10;
    estimatedNutrition.sugar = Math.round(estimatedNutrition.sugar * 10) / 10;

    // 가장 많이 구매한 품목
    const mostPurchased = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // 카테고리 트렌드 (현재는 단순히 개수 기반)
    const categoryTrend = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        trend: 'stable' as const, // 향후 이전 기간과 비교 가능
      }))
      .sort((a, b) => b.count - a.count);

    // 추천 생성
    const recommendations = generateRecommendations(categoryCount, totalItems, period);

    const report: PeriodReport = {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      totalItems,
      categoryDistribution: categoryCount,
      estimatedNutrition,
      purchaseHistory: purchaseHistory.slice(0, 10), // 최근 10개
      trends: {
        mostPurchased,
        categoryTrend,
      },
      recommendations,
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Nutrition report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  categoryCount: Record<string, number>,
  totalItems: number,
  period: 'week' | 'month'
): string[] {
  const recommendations: string[] = [];
  const periodLabel = period === 'week' ? '이번 주' : '이번 달';

  if (totalItems === 0) {
    recommendations.push(`${periodLabel}에 기록된 구매/추가 내역이 없습니다.`);
    recommendations.push('영수증을 스캔하거나 재료를 추가해보세요.');
    return recommendations;
  }

  // 채소류 비율 체크
  const vegetableRatio = ((categoryCount.vegetables || 0) / totalItems) * 100;
  if (vegetableRatio < 20) {
    recommendations.push('채소류 구매를 늘려보세요. 균형 잡힌 식단에 필수입니다.');
  } else if (vegetableRatio > 30) {
    recommendations.push('채소 섭취가 좋습니다! 현재 패턴을 유지하세요.');
  }

  // 단백질 체크
  const proteinItems = (categoryCount.meat || 0) + (categoryCount.seafood || 0) + (categoryCount.dairy || 0);
  const proteinRatio = (proteinItems / totalItems) * 100;
  if (proteinRatio < 15) {
    recommendations.push('단백질 공급원(육류, 해산물, 유제품)을 더 구매해보세요.');
  }

  // 간식 체크
  const snackRatio = ((categoryCount.snacks || 0) / totalItems) * 100;
  if (snackRatio > 15) {
    recommendations.push('간식 구매 비율이 높습니다. 건강한 대안을 고려해보세요.');
  }

  // 다양성 체크
  const categoryTypes = Object.keys(categoryCount).length;
  if (categoryTypes < 4) {
    recommendations.push('더 다양한 종류의 식재료를 구매해보세요.');
  } else if (categoryTypes >= 6) {
    recommendations.push('다양한 식재료를 구매하고 있어요! 훌륭합니다.');
  }

  // 기본 추천
  if (recommendations.length === 0) {
    recommendations.push(`${periodLabel} 구매 패턴이 균형 잡혀 있습니다.`);
  }

  return recommendations.slice(0, 4);
}
