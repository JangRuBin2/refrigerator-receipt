import { createClient } from '@/lib/supabase/client';
import type { IngredientCreate, IngredientUpdate } from '@/lib/validations';

export async function getIngredients() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createIngredient(input: IngredientCreate) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      user_id: user.id,
      name: input.name,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      storage_type: input.storage_type,
      purchase_date: input.purchase_date,
      expiry_date: input.expiry_date,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIngredient(id: string, input: IngredientUpdate) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('ingredients')
    .update(input)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteIngredient(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
