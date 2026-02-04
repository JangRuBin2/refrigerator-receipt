import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

interface Recipe {
  id: string;
  title: { ko: string; en?: string };
  ingredients: RecipeIngredient[];
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 재료 목록 가져오기
    const { data: userIngredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('name')
      .eq('user_id', user.id);

    if (ingredientsError) {
      return NextResponse.json({ error: ingredientsError.message }, { status: 500 });
    }

    const userIngredientNames = userIngredients?.map(i => i.name.toLowerCase()) || [];

    // 모든 레시피 가져오기
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');

    if (recipesError) {
      return NextResponse.json({ error: recipesError.message }, { status: 500 });
    }

    // 매칭률 계산
    const recipesWithMatch = (recipes as Recipe[] || []).map(recipe => {
      const recipeIngredients = (recipe.ingredients as RecipeIngredient[]) || [];
      const totalIngredients = recipeIngredients.length;

      if (totalIngredients === 0) {
        return { ...recipe, matchRate: 0, matchedIngredients: [], missingIngredients: [] };
      }

      const matchedIngredients: string[] = [];
      const missingIngredients: string[] = [];

      recipeIngredients.forEach(ri => {
        const ingredientName = ri.name.toLowerCase();
        const isMatched = userIngredientNames.some(
          ui => ui.includes(ingredientName) || ingredientName.includes(ui)
        );

        if (isMatched) {
          matchedIngredients.push(ri.name);
        } else {
          missingIngredients.push(ri.name);
        }
      });

      const matchRate = Math.round((matchedIngredients.length / totalIngredients) * 100);

      return {
        ...recipe,
        matchRate,
        matchedIngredients,
        missingIngredients,
      };
    });

    // 매칭률 순으로 정렬
    recipesWithMatch.sort((a, b) => b.matchRate - a.matchRate);

    return NextResponse.json(recipesWithMatch);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
