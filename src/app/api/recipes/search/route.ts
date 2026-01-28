import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchYouTubeRecipes } from '@/lib/search/youtube';
import { searchGoogleRecipes } from '@/lib/search/google';
import type { ExternalRecipe } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    let ingredientsParam = searchParams.get('ingredients');

    // 재료가 지정되지 않으면 사용자 냉장고에서 랜덤 선택
    if (!ingredientsParam) {
      const { data: userIngredients } = await supabase
        .from('ingredients')
        .select('name')
        .eq('user_id', user.id);

      const names = userIngredients?.map(i => i.name) || [];
      if (names.length === 0) {
        return NextResponse.json({ error: '냉장고에 재료가 없습니다. 재료를 먼저 추가해주세요.' }, { status: 400 });
      }

      // 랜덤 2~3개 선택
      const shuffled = names.sort(() => Math.random() - 0.5);
      const count = Math.min(shuffled.length, Math.floor(Math.random() * 2) + 2);
      ingredientsParam = shuffled.slice(0, count).join(',');
    }

    const query = ingredientsParam.replace(/,/g, ' ');
    const results: ExternalRecipe[] = [];

    const promises: Promise<ExternalRecipe[]>[] = [];

    if (type === 'all' || type === 'youtube') {
      promises.push(
        searchYouTubeRecipes(query).catch((e) => {
          console.error('YouTube search error:', e);
          return [];
        })
      );
    }

    if (type === 'all' || type === 'google') {
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
      query: ingredientsParam,
      results,
    });
  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
