import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 전체 레시피 수 가져오기
    const { count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    if (!count || count === 0) {
      return NextResponse.json({ error: 'No recipes found' }, { status: 404 });
    }

    // 랜덤 오프셋 계산
    const randomOffset = Math.floor(Math.random() * count);

    // 랜덤 레시피 가져오기
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .range(randomOffset, randomOffset)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
