'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart,
  Plus,
  Loader2,
  RefreshCw,
  CheckCircle,
  Package,
  AlertTriangle,
} from 'lucide-react';

import { PremiumModal } from '@/components/premium/PremiumModal';
import { AdWatchingOverlay } from '@/components/ads/AdWatchingOverlay';
import { usePremiumAction } from '@/hooks/usePremiumAction';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ShoppingItem } from '@/types/supabase';
import { AddItemModal } from '@/features/shopping/AddItemModal';
import { AiRecommendations } from '@/features/shopping/AiRecommendations';
import { ShoppingItemGroup } from '@/features/shopping/ShoppingItemGroup';
import { useShoppingList } from '@/features/shopping/useShoppingList';
import { useShoppingRecommendations } from '@/features/shopping/useShoppingRecommendations';

export default function ShoppingPage() {
  const t = useTranslations();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unchecked' | 'checked'>('all');
  const { executeWithPremiumCheck, showPremiumModal, closePremiumModal, isWatchingAd } = usePremiumAction();

  const {
    list, loading, error, addError,
    fetchList, addItem, toggleCheck, deleteItem, completeList,
  } = useShoppingList();

  const recommend = useShoppingRecommendations();

  const addRecommendedItem = async (item: { name: string; quantity: number; unit: ShoppingItem['unit']; category: ShoppingItem['category']; reason: string }) => {
    await addItem({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category });
    recommend.removeItem(item.name);
  };

  const totalItems = list?.items.length || 0;
  const checkedItems = list?.items.filter(i => i.checked).length || 0;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const filteredItems = useMemo(() =>
    (list?.items || []).filter(item => {
      if (filter === 'unchecked') return !item.checked;
      if (filter === 'checked') return item.checked;
      return true;
    }),
    [list?.items, filter]
  );

  const groupedItems = useMemo(() =>
    filteredItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
      const category = item.category || 'etc';
      return { ...acc, [category]: [...(acc[category] || []), item] };
    }, {}),
    [filteredItems]
  );

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
    <>
    <AdWatchingOverlay isVisible={isWatchingAd} />
    <PremiumModal isOpen={showPremiumModal} onClose={closePremiumModal} feature="smart_shopping" />
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
          recommendations={recommend.recommendations}
          loading={recommend.loading}
          error={recommend.error}
          hasFetched={recommend.fetched}
          onFetch={() => executeWithPremiumCheck(recommend.fetch)}
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
        onAdd={(item) => addItem(item, () => setShowAddModal(false))}
        error={addError}
      />
    </div>
    </>
  );
}
