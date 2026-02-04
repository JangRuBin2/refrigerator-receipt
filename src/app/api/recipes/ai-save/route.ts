import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiRecipeSaveSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = aiRecipeSaveSchema.parse(body);
    const locale = validated.locale || 'ko';

    // 중복 체크: 같은 사용자가 같은 제목의 AI 레시피를 이미 저장했는지
    const { data: existingRecipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('source', 'ai_generated')
      .eq(`title->>${locale}`, validated.title)
      .single();

    if (existingRecipe) {
      // 이미 저장된 레시피가 있으면 즐겨찾기에 추가만 시도
      const { data: existingFavorite } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', existingRecipe.id)
        .single();

      if (existingFavorite) {
        return NextResponse.json(
          { error: 'Recipe already saved', recipe_id: existingRecipe.id },
          { status: 409 }
        );
      }

      // 즐겨찾기에 추가
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, recipe_id: existingRecipe.id });

      return NextResponse.json({
        success: true,
        recipe_id: existingRecipe.id,
        message: 'Added to favorites'
      });
    }

    // 새 레시피 저장
    const description = validated.tips
      ? `${validated.description || ''}\n\n💡 팁: ${validated.tips}`
      : validated.description || '';

    const recipeData = {
      source: 'ai_generated',
      source_url: null,
      title: { [locale]: validated.title },
      description: { [locale]: description },
      cooking_time: validated.cookingTime,
      difficulty: validated.difficulty,
      servings: validated.servings,
      ingredients: validated.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity
      })),
      instructions: { [locale]: validated.instructions },
      tags: ['ai_generated', 'custom'],
    };

    const { data: newRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert(recipeData)
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
    }

    // 즐겨찾기에 자동 추가
    await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, recipe_id: newRecipe.id });

    return NextResponse.json({
      success: true,
      recipe_id: newRecipe.id,
      message: 'Recipe saved and added to favorites'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
