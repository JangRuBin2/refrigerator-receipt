import { createClient } from '@/lib/supabase/client';
import type { Category, Unit, StorageType } from '@/types';

export interface IngredientCreate {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  storage_type: StorageType;
  purchase_date: string;
  expiry_date: string;
}

export interface IngredientUpdate {
  name?: string;
  category?: Category;
  quantity?: number;
  unit?: Unit;
  storage_type?: StorageType;
  purchase_date?: string;
  expiry_date?: string;
}

// DB row → client format mapping
export function dbToClient(row: {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storage_type: string;
  purchase_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    quantity: row.quantity,
    unit: row.unit as Unit,
    storageType: row.storage_type as StorageType,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getIngredients() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(dbToClient);
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
  return dbToClient(data);
}

export async function updateIngredientApi(id: string, input: IngredientUpdate) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('ingredients')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return dbToClient(data);
}

export async function deleteIngredientApi(id: string) {
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

export async function clearIngredientsApi() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
}
