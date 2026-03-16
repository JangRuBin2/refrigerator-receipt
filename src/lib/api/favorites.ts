import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const favoriteRecipeSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  recipe: z.object({
    id: z.string(),
    title: z.unknown().transform(v =>
      (v && typeof v === 'object' && !Array.isArray(v)) ? v as Record<string, string> : {}
    ),
    description: z.unknown().transform(v =>
      (v && typeof v === 'object' && !Array.isArray(v)) ? v as Record<string, string> : {}
    ).optional(),
    cooking_time: z.number().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    servings: z.number().nullable().optional(),
    ingredients: z.unknown().transform(v => Array.isArray(v) ? v as Array<{ name: string; quantity?: string }> : []).optional(),
    instructions: z.unknown().transform(v => Array.isArray(v) ? v as string[] : []).optional(),
    tips: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
  }).nullable(),
});

export type FavoriteRecipe = z.infer<typeof favoriteRecipeSchema>;

export async function getFavorites(): Promise<FavoriteRecipe[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      id,
      created_at,
      recipe:recipes(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(item => favoriteRecipeSchema.parse(item));
}

export async function addFavorite(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: user.id,
      recipe_id: recipeId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Already favorited');
    }
    throw error;
  }
  return data;
}

export async function removeFavorite(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId);

  if (error) throw error;
}
