'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Loader2,
  RefreshCw,
  CheckCircle,
  Package,
  AlertTriangle,
} from 'lucide-react';

import { PremiumGate } from '@/components/premium/PremiumGate';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { z } from 'zod';
import { cn, extractErrorMessage } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { categorySchema, unitSchema } from '@/lib/validations';
import type { ShoppingItem } from '@/types/supabase';
import {
  getShoppingList,
  addShoppingItems,
  updateShoppingItem,
  deleteShoppingItem as deleteShoppingItemApi,
  completeShoppingList,
  getShoppingRecommendations,
  type ParsedShoppingList,
} from '@/lib/api/shopping';
import { getIngredients } from '@/lib/api/ingredients';
import { AddItemModal } from '@/features/shopping/AddItemModal';
import { AiRecommendations } from '@/features/shopping/AiRecommendations';
import { ShoppingItemGroup } from '@/features/shopping/ShoppingItemGroup';

const recommendedItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: unitSchema,
  category: categorySchema,
  reason: z.string(),
});

const recommendResponseSchema = z.object({
  recommendations: z.array(recommendedItemSchema).optional().default([]),
  source: z.string().optional(),
});

type RecommendedItem = z.infer<typeof recommendedItemSchema>;

export default function ShoppingPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'ko';

  const [list, setList] = useState<ParsedShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unchecked' | 'checked'>('all');
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [recommendError, setRecommendError] = useState(false);
  const [recommendFetched, setRecommendFetched] = useState(false);

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

  const fetchRecommendations = useCallback(async () => {
    setRecommendLoading(true);
    setRecommendError(false);
    try {
      // Store에서 먼저 시도, 비어있으면 DB에서 직접 조회
      let ingredientNames = useStore.getState().ingredients.map((i) => i.name);
      if (ingredientNames.length === 0) {
        const dbIngredients = await getIngredients();
        ingredientNames = dbIngredients.map((i) => i.name);
        if (dbIngredients.length > 0) {
          useStore.getState().setIngredients(dbIngredients);
        }
      }
      const raw = await getShoppingRecommendations(ingredientNames);
      const data = recommendResponseSchema.parse(raw);
      setRecommendations(data.recommendations);
    } catch {
      setRecommendError(true);
      setRecommendations([]);
    } finally {
      setRecommendLoading(false);
      setRecommendFetched(true);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const addItem = async (item: Partial<ShoppingItem>) => {
    if (!item.name?.trim()) return;
    setAddError(null);
    try {
      const data = await addShoppingItems(
        [{ name: item.name!, quantity: item.quantity, unit: item.unit, category: item.category }],
        list?.id
      );
      setList(data.list);
      setShowAddModal(false);
    } catch (err) {
      setAddError(`${t('shopping.addError')} ${extractErrorMessage(err)}`);
    }
  };

  const addRecommendedItem = async (item: RecommendedItem) => {
    await addItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    });
    setRecommendations(prev => prev.filter(r => r.name !== item.name));
  };

  const toggleCheck = async (itemId: string, checked: boolean) => {
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
  };

  const deleteItem = async (itemId: string) => {
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
  };

  const completeList = async () => {
    if (!list) return;
    try {
      await completeShoppingList(list.id);
      fetchList();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const filteredItems = (list?.items || []).filter(item => {
    if (filter === 'unchecked') return !item.checked;
    if (filter === 'checked') return item.checked;
    return true;
  });

  const totalItems = list?.items.length || 0;
  const checkedItems = list?.items.filter(i => i.checked).length || 0;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const groupedItems = filteredItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const category = item.category || 'etc';
    return {
      ...acc,
      [category]: [...(acc[category] || []), item],
    };
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
          <p className="text-gray-500 text-center">{error}</p>
          <Button onClick={fetchList} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate feature="smart_shopping">
    <div className="min-h-screen pb-8">
      <div className="space-y-4 p-4">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <span className="font-semibold">{t('shopping.progress')}</span>
              </div>
              <Badge variant={progress === 100 ? 'success' : 'default'}>
                {checkedItems} / {totalItems}
              </Badge>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && totalItems > 0 && (
              <Button onClick={completeList} className="w-full mt-3" variant="secondary">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('shopping.completeList')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Filter & Add */}
        <div className="flex gap-2">
          <div className="flex gap-1 flex-1">
            {(['all', 'unchecked', 'checked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {t(`shopping.filter.${f}`)}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <AiRecommendations
          recommendations={recommendations}
          loading={recommendLoading}
          error={recommendError}
          hasFetched={recommendFetched}
          onFetch={fetchRecommendations}
          onAdd={addRecommendedItem}
        />

        {/* Shopping List */}
        {totalItems === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">{t('shopping.empty')}</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {t('shopping.addItem')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <ShoppingItemGroup
                key={category}
                category={category}
                items={items}
                onToggleCheck={toggleCheck}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
        error={addError}
      />
    </div>
    </PremiumGate>
  );
}
