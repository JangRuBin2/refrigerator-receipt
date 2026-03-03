import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import { scoreRecipes, type ScoredRecipe } from '@/lib/recommend/engine';
import type { Json } from '@/types/supabase';

function parseJsonStringArray(json: Json): string[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'name' in item) {
        return typeof (item as Record<string, unknown>).name === 'string'
          ? (item as Record<string, unknown>).name as string
          : '';
      }
      return '';
    })
    .filter(Boolean);
}

function getLocalizedString(json: Json, locale: string): string {
  if (typeof json === 'string') return json;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, Json | undefined>;
    return String(obj[locale] ?? obj.ko ?? obj.en ?? '');
  }
  return '';
}

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
    // Sanitize: strip PostgREST special characters to prevent filter injection
    const sanitized = options.search.replace(/[%_.,()\\]/g, '');
    if (sanitized.length > 0) {
      query = query.or(
        `title->ko.ilike.%${sanitized}%,title->en.ilike.%${sanitized}%`
      );
    }
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { recipes: data, total: count, limit, offset };
}

export async function getRecommendedRecipes(ingredientNames: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, description, cooking_time, difficulty, ingredients, tags');

  if (error) throw error;

  const scored = (data ?? []).map((recipe) => {
    const recipeIngredients = parseJsonStringArray(recipe.ingredients);

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

  const difficultySchema = z.enum(['easy', 'medium', 'hard']).nullable().catch(null);

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      source: 'ai',
      title: { [locale]: recipe.title },
      description: { [locale]: recipe.description || '' },
      cooking_time: recipe.cookingTime,
      difficulty: difficultySchema.parse(recipe.difficulty),
      servings: recipe.servings,
      ingredients: recipe.ingredients as unknown as Json,
      instructions: { [locale]: recipe.instructions },
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
  return callEdgeFunction('recipes-search', {
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

  const mapped = recipes.map((r) => ({
    id: r.id,
    title: r.title as unknown,
    description: r.description as unknown,
    cooking_time: r.cooking_time ?? undefined,
    difficulty: r.difficulty ?? undefined,
    ingredients: r.ingredients as unknown,
    tags: r.tags ?? undefined,
  }));

  return scoreRecipes(mapped, answers).slice(0, 5);
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
