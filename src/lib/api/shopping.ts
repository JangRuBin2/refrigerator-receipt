import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import { categorySchema, unitSchema } from '@/lib/validations';
import type { ShoppingItem, Json } from '@/types/supabase';

const shoppingItemArraySchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: unitSchema,
  category: categorySchema,
  checked: z.boolean(),
  addedAt: z.string(),
}));

function parseShoppingItems(raw: Json): ShoppingItem[] {
  const result = shoppingItemArraySchema.safeParse(raw);
  return result.success ? result.data : [];
}

function toJson(items: ShoppingItem[]): Json {
  return items as unknown as Json;
}

export interface ParsedShoppingList {
  id: string;
  user_id: string;
  name: string;
  items: ShoppingItem[];
  is_active: boolean;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

function parseShoppingList(row: {
  id: string;
  user_id: string;
  name: string;
  items: Json;
  is_active: boolean;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}): ParsedShoppingList {
  return { ...row, items: parseShoppingItems(row.items) };
}

export async function getShoppingList() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: list, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (!list) {
    const { data: newList, error: createError } = await supabase
      .from('shopping_lists')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: '장보기 목록',
        items: [],
        is_active: true,
      })
      .select()
      .single();

    if (createError) throw createError;
    return { list: parseShoppingList(newList) };
  }

  return { list: parseShoppingList(list) };
}

export async function addShoppingItems(
  items: { name: string; quantity?: number; unit?: string; category?: string }[],
  listId?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let targetListId = listId;
  if (!targetListId) {
    const { data: existingList } = await supabase
      .from('shopping_lists')
      .select('id, items')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingList) {
      targetListId = existingList.id;
    } else {
      const { data: newList, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: '장보기 목록',
          items: [],
          is_active: true,
        })
        .select('id')
        .single();

      if (createError) throw createError;
      targetListId = newList.id;
    }
  }

  const { data: currentList, error: fetchError } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('id', targetListId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  const existingItems = parseShoppingItems(currentList.items);
  const newItems: ShoppingItem[] = items.map(item => ({
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: unitSchema.catch('ea').parse(item.unit ?? 'ea'),
    category: categorySchema.catch('etc').parse(item.category ?? 'etc'),
    checked: false,
    addedAt: new Date().toISOString(),
  }));

  const updatedItems = [...existingItems, ...newItems];

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ items: toJson(updatedItems) })
    .eq('id', targetListId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return { list: parseShoppingList(updatedList), addedItems: newItems };
}

export async function updateShoppingItem(
  listId: string,
  itemId: string,
  updates: Partial<ShoppingItem>
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: currentList, error: fetchError } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  const items = parseShoppingItems(currentList.items);
  const updatedItems = items.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ items: toJson(updatedItems) })
    .eq('id', listId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return { list: parseShoppingList(updatedList) };
}

export async function deleteShoppingItem(listId: string, itemId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: currentList, error: fetchError } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  const items = parseShoppingItems(currentList.items);
  const updatedItems = items.filter(item => item.id !== itemId);

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ items: toJson(updatedItems) })
    .eq('id', listId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return { list: parseShoppingList(updatedList) };
}

export async function completeShoppingList(listId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('shopping_lists')
    .update({
      is_active: false,
      completed_at: new Date().toISOString(),
    })
    .eq('id', listId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getShoppingRecommendations(ingredientNames: string[]) {
  return callEdgeFunction('shopping-recommend', {
    body: { ingredients: ingredientNames },
  });
}
