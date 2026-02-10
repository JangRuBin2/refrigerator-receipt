import { createClient } from '@/lib/supabase/client';

export async function getFavorites() {
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
  return data;
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
