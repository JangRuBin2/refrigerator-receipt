import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shoppingAddSchema, shoppingUpdateSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import type { ShoppingItem, Category, Unit } from '@/types/supabase';

// GET: 활성 장보기 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 활성 장보기 목록 조회 (최근 것 하나)
    const { data: list, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // 목록이 없으면 새로 생성
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

      return NextResponse.json({ list: newList });
    }

    return NextResponse.json({ list });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}

// POST: 장보기 목록에 아이템 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = shoppingAddSchema.parse(body);

    // 활성 목록 조회 또는 생성
    let targetListId = validated.listId;
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

    // 현재 목록의 아이템 조회
    const { data: currentList, error: fetchError } = await supabase
      .from('shopping_lists')
      .select('items')
      .eq('id', targetListId)
      .single();

    if (fetchError) throw fetchError;

    // 새 아이템 추가
    const existingItems = (currentList.items as ShoppingItem[]) || [];
    const newItems: ShoppingItem[] = validated.items.map(item => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit as Unit,
      category: item.category as Category,
      checked: false,
      addedAt: new Date().toISOString(),
    }));

    const updatedItems = [...existingItems, ...newItems];

    // 목록 업데이트
    const { data: updatedList, error: updateError } = await supabase
      .from('shopping_lists')
      .update({ items: updatedItems })
      .eq('id', targetListId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ list: updatedList, addedItems: newItems });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add items' },
      { status: 500 }
    );
  }
}

// PATCH: 아이템 업데이트 (체크, 수정)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = shoppingUpdateSchema.parse(body);

    // 현재 목록 조회
    const { data: currentList, error: fetchError } = await supabase
      .from('shopping_lists')
      .select('items')
      .eq('id', validated.listId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // 아이템 업데이트
    const items = (currentList.items as ShoppingItem[]) || [];
    const updatedItems = items.map(item =>
      item.id === validated.itemId ? { ...item, ...validated.updates } : item
    );

    // 목록 업데이트
    const { data: updatedList, error: updateError } = await supabase
      .from('shopping_lists')
      .update({ items: updatedItems })
      .eq('id', validated.listId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE: 아이템 삭제 또는 목록 완료
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const itemId = searchParams.get('itemId');
    const completeList = searchParams.get('complete') === 'true';

    if (!listId) {
      return NextResponse.json({ error: 'listId is required' }, { status: 400 });
    }

    // 목록 완료 처리
    if (completeList) {
      const { error } = await supabase
        .from('shopping_lists')
        .update({
          is_active: false,
          completed_at: new Date().toISOString(),
        })
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'List completed' });
    }

    // 개별 아이템 삭제
    if (itemId) {
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

      return NextResponse.json({ list: updatedList });
    }

    return NextResponse.json({ error: 'itemId or complete flag is required' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}
