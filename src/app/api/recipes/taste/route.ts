import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scoreRecipes } from '@/lib/recommend/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers } = await request.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, description, cooking_time, difficulty, ingredients, tags');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: 'No recipes found' }, { status: 404 });
    }

    const scored = scoreRecipes(recipes, answers);
    // 상위 5개 반환
    return NextResponse.json(scored.slice(0, 5));
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
