import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchYouTubeRecipes, isYouTubeConfigured } from '@/lib/search/youtube';
import { searchGoogleRecipes, isGoogleConfigured } from '@/lib/search/google';
import type { ExternalRecipe } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const customQuery = searchParams.get('q'); // 수동 검색 쿼리
    const strategy = searchParams.get('strategy') || 'random'; // random | expiring
    let ingredientsParam = searchParams.get('ingredients');

    // API 설정 상태 확인
    const youtubeConfigured = isYouTubeConfigured();
    const googleConfigured = isGoogleConfigured();

    if (!youtubeConfigured && !googleConfigured) {
      return NextResponse.json({
        error: 'Search APIs are not configured',
        apiStatus: {
          youtube: false,
          google: false,
        },
        results: [],
      }, { status: 503 });
    }

    // 수동 검색 쿼리가 있으면 그대로 사용
    let query: string;
    if (customQuery) {
      query = customQuery;
    } else if (ingredientsParam) {
      // 재료 파라미터가 있으면 그대로 사용
      query = ingredientsParam.replace(/,/g, ' ');
    } else {
      // 재료가 지정되지 않으면 사용자 냉장고에서 선택
      const { data: userIngredients } = await supabase
        .from('ingredients')
        .select('name, expiry_date')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true }); // 유통기한 임박 순 정렬

      const ingredients = userIngredients || [];
      if (ingredients.length === 0) {
        return NextResponse.json({
          error: '냉장고에 재료가 없습니다. 재료를 먼저 추가해주세요.',
          apiStatus: {
            youtube: youtubeConfigured,
            google: googleConfigured,
          },
          results: [],
        }, { status: 400 });
      }

      let selected: string[];

      if (strategy === 'expiring') {
        // 유통기한 임박 전략: 가장 임박한 재료 2~3개 선택
        const count = Math.min(ingredients.length, Math.floor(Math.random() * 2) + 2);
        selected = ingredients.slice(0, count).map(i => i.name);
      } else {
        // 랜덤 전략: 랜덤 2~3개 선택
        const names = ingredients.map(i => i.name);
        const shuffled = names.sort(() => Math.random() - 0.5);
        const count = Math.min(shuffled.length, Math.floor(Math.random() * 2) + 2);
        selected = shuffled.slice(0, count);
      }

      ingredientsParam = selected.join(',');
      query = selected.join(' ');
    }

    const results: ExternalRecipe[] = [];
    const promises: Promise<ExternalRecipe[]>[] = [];

    // YouTube 검색
    if ((type === 'all' || type === 'youtube') && youtubeConfigured) {
      promises.push(
        searchYouTubeRecipes(query).catch((e) => {
          console.error('YouTube search error:', e);
          return [];
        })
      );
    }

    // Google 검색
    if ((type === 'all' || type === 'google') && googleConfigured) {
      promises.push(
        searchGoogleRecipes(query).catch((e) => {
          console.error('Google search error:', e);
          return [];
        })
      );
    }

    const allResults = await Promise.all(promises);
    allResults.forEach(r => results.push(...r));

    // 셔플해서 섞기
    results.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      query: customQuery || ingredientsParam,
      results,
      apiStatus: {
        youtube: youtubeConfigured,
        google: googleConfigured,
      },
      strategy,
    });
  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
