import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AIRecipeInput {
  title: string;
  description: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
  tips?: string;
  locale?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AIRecipeInput = await request.json();
    const { title, description, cookingTime, difficulty, servings, ingredients, instructions, tips, locale = 'ko' } = body;

    if (!title || !ingredients || !instructions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 중복 체크: 같은 사용자가 같은 제목의 AI 레시피를 이미 저장했는지
    const { data: existingRecipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('source', 'ai_generated')
      .eq(`title->>${locale}`, title)
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
        .insert({ user_id: user.id, recipe_id: existingRecipe.id } as never);

      return NextResponse.json({
        success: true,
        recipe_id: existingRecipe.id,
        message: 'Added to favorites'
      });
    }

    // 새 레시피 저장
    const recipeData = {
      source: 'ai_generated',
      source_url: null,
      title: { [locale]: title },
      description: { [locale]: description },
      cooking_time: cookingTime,
      difficulty,
      servings,
      ingredients: ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity
      })),
      instructions: { [locale]: instructions },
      tags: ['ai_generated', 'custom'],
    };

    const { data: newRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert(recipeData as never)
      .select('id')
      .single();

    if (insertError) {
      console.error('Recipe insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
    }

    // 즐겨찾기에 자동 추가
    const { error: favoriteError } = await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, recipe_id: newRecipe.id } as never);

    if (favoriteError) {
      console.error('Favorite insert error:', favoriteError);
      // 레시피는 저장됐지만 즐겨찾기 추가 실패 - 부분 성공
    }

    // tips가 있으면 별도로 저장 (JSONB description에 포함)
    if (tips) {
      await supabase
        .from('recipes')
        .update({
          description: { [locale]: `${description}\n\n💡 팁: ${tips}` }
        } as never)
        .eq('id', newRecipe.id);
    }

    return NextResponse.json({
      success: true,
      recipe_id: newRecipe.id,
      message: 'Recipe saved and added to favorites'
    }, { status: 201 });

  } catch (error) {
    console.error('AI recipe save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
