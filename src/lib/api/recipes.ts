import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import { scoreRecipes, type ScoredRecipe } from '@/lib/recommend/engine';

export async function getRecipes(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('recipes')
    .select('*', { count: 'exact' });

  if (options?.search) {
    query = query.or(
      `title->ko.ilike.%${options.search}%,title->en.ilike.%${options.search}%`
    );
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { recipes: data, total: count, limit, offset };
}

export async function getRandomRecipes(count: number = 5) {
  const supabase = createClient();

  const { data: total } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .limit(count);

  if (error) throw error;
  return data;
}

export async function getRecommendedRecipes(ingredientNames: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('recipes')
    .select('*');

  if (error) throw error;

  const scored = (data ?? []).map((recipe) => {
    const recipeIngredients: string[] = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((i: { name?: string }) =>
          typeof i === 'string' ? i : i?.name ?? ''
        )
      : [];

    const matchCount = recipeIngredients.filter((ri) =>
      ingredientNames.some((name) =>
        ri.toLowerCase().includes(name.toLowerCase())
      )
    ).length;

    return { ...recipe, matchScore: matchCount };
  });

  return scored
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}

export async function saveAiRecipe(recipe: {
  title: string;
  description?: string;
  cookingTime: number;
  difficulty: string;
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
  tips?: string;
  locale?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const locale = recipe.locale || 'ko';

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      title: { [locale]: recipe.title },
      description: { [locale]: recipe.description || '' },
      cooking_time: recipe.cookingTime,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: { [locale]: recipe.instructions },
      tips: recipe.tips ? { [locale]: recipe.tips } : null,
      is_ai_generated: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function aiGenerateRecipe(input: {
  ingredients: string[];
  preferences?: {
    cookingTime?: string;
    difficulty?: string;
    cuisine?: string;
  };
  locale?: string;
}) {
  return callEdgeFunction('recipes-ai-generate', { body: input });
}

export async function searchRecipes(query: string, locale?: string) {
  return callEdgeFunction<{ results: unknown[] }>('recipes-search', {
    body: { query, locale },
  });
}

export async function scoreByTaste(answers: Record<string, string>): Promise<ScoredRecipe[]> {
  const supabase = createClient();
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, description, cooking_time, difficulty, ingredients, tags');

  if (error) throw error;
  if (!recipes?.length) return [];

  return scoreRecipes(recipes, answers).slice(0, 5);
}

export async function getRandomRecipe() {
  const supabase = createClient();

  const { count } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true });

  if (!count || count === 0) throw new Error('No recipes found');

  const randomOffset = Math.floor(Math.random() * count);

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .range(randomOffset, randomOffset)
    .single();

  if (error) throw error;
  return data;
}
