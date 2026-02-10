import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import type { ShoppingItem, Category, Unit } from '@/types/supabase';

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
        user_id: user.id,
        name: '장보기 목록',
        items: [],
        is_active: true,
      })
      .select()
      .single();

    if (createError) throw createError;
    return { list: newList };
  }

  return { list };
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
    .single();

  if (fetchError) throw fetchError;

  const existingItems = (currentList.items as ShoppingItem[]) || [];
  const newItems: ShoppingItem[] = items.map(item => ({
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: (item.unit as Unit) ?? 'ea',
    category: (item.category as Category) ?? 'etc',
    checked: false,
    addedAt: new Date().toISOString(),
  }));

  const updatedItems = [...existingItems, ...newItems];

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ items: updatedItems })
    .eq('id', targetListId)
    .select()
    .single();

  if (updateError) throw updateError;
  return { list: updatedList, addedItems: newItems };
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

  const items = (currentList.items as ShoppingItem[]) || [];
  const updatedItems = items.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ items: updatedItems })
    .eq('id', listId)
    .select()
    .single();

  if (updateError) throw updateError;
  return { list: updatedList };
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

  const items = (currentList.items as ShoppingItem[]) || [];
  const updatedItems = items.filter(item => item.id !== itemId);

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ items: updatedItems })
    .eq('id', listId)
    .select()
    .single();

  if (updateError) throw updateError;
  return { list: updatedList };
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
