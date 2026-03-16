'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/store/useToastStore';
import { extractErrorMessage } from '@/lib/utils';
import type { ShoppingItem } from '@/types/supabase';
import {
  getShoppingList,
  addShoppingItems,
  updateShoppingItem,
  deleteShoppingItem as deleteShoppingItemApi,
  completeShoppingList,
  type ParsedShoppingList,
} from '@/lib/api/shopping';

export function useShoppingList() {
  const t = useTranslations();
  const [list, setList] = useState<ParsedShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const data = await getShoppingList();
      setList(data.list);
    } catch (err) {
      setError(`${t('shopping.loadError')} ${extractErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const addItem = useCallback(async (item: Partial<ShoppingItem>, onSuccess?: () => void) => {
    if (!item.name?.trim()) return;
    setAddError(null);
    try {
      const data = await addShoppingItems(
        [{ name: item.name!, quantity: item.quantity, unit: item.unit, category: item.category }],
        list?.id
      );
      setList(data.list);
      onSuccess?.();
    } catch (err) {
      setAddError(`${t('shopping.addError')} ${extractErrorMessage(err)}`);
    }
  }, [list?.id, t]);

  const toggleCheck = useCallback(async (itemId: string, checked: boolean) => {
    if (!list) return;
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, checked } : item
        ),
      };
    });
    try {
      await updateShoppingItem(list.id, itemId, { checked });
    } catch {
      fetchList();
    }
  }, [list, fetchList]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!list) return;
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      };
    });
    try {
      await deleteShoppingItemApi(list.id, itemId);
    } catch {
      fetchList();
    }
  }, [list, fetchList]);

  const completeList = useCallback(async () => {
    if (!list) return;
    try {
      await completeShoppingList(list.id);
      fetchList();
    } catch {
      toast.error(t('common.error'));
    }
  }, [list, fetchList, t]);

  return {
    list,
    loading,
    error,
    addError,
    fetchList,
    addItem,
    toggleCheck,
    deleteItem,
    completeList,
  };
}
