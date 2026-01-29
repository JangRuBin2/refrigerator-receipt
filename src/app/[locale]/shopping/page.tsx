'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Circle,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { Category, Unit, ShoppingItem } from '@/types/supabase';

const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

interface RecommendedItem {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  reason: string;
}

interface ShoppingListData {
  id: string;
  name: string;
  items: ShoppingItem[];
  is_active: boolean;
  created_at: string;
}

export default function ShoppingPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [list, setList] = useState<ShoppingListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'ea' as Unit,
    category: 'etc' as Category,
  });
  const [filter, setFilter] = useState<'all' | 'unchecked' | 'checked'>('all');

  // 목록 조회
  const fetchList = useCallback(async () => {
    try {
      const response = await fetch('/api/shopping');
      if (response.ok) {
        const data = await response.json();
        setList(data.list);
      }
    } catch (error) {
      console.error('Failed to fetch list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // AI 추천 조회
  const fetchRecommendations = async () => {
    setRecommendLoading(true);
    try {
      const response = await fetch('/api/shopping/recommend');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setRecommendLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    fetchRecommendations();
  }, [fetchList]);

  // 아이템 추가
  const addItem = async (item: Partial<ShoppingItem>) => {
    if (!item.name?.trim()) return;

    try {
      const response = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [item],
          listId: list?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setList(data.list);
        setShowAddModal(false);
        setNewItem({ name: '', quantity: 1, unit: 'ea', category: 'etc' });
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  // 추천 아이템 추가
  const addRecommendedItem = async (item: RecommendedItem) => {
    await addItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    });
    // 추천 목록에서 제거
    setRecommendations(prev => prev.filter(r => r.name !== item.name));
  };

  // 체크 토글
  const toggleCheck = async (itemId: string, checked: boolean) => {
    if (!list) return;

    // 낙관적 업데이트
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
      await fetch('/api/shopping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: list.id,
          itemId,
          updates: { checked },
        }),
      });
    } catch (error) {
      console.error('Failed to toggle check:', error);
      // 실패 시 롤백
      fetchList();
    }
  };

  // 아이템 삭제
  const deleteItem = async (itemId: string) => {
    if (!list) return;

    // 낙관적 업데이트
    setList(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      };
    });

    try {
      await fetch(`/api/shopping?listId=${list.id}&itemId=${itemId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      fetchList();
    }
  };

  // 목록 완료
  const completeList = async () => {
    if (!list) return;

    try {
      await fetch(`/api/shopping?listId=${list.id}&complete=true`, {
        method: 'DELETE',
      });
      // 새 목록 생성됨
      fetchList();
    } catch (error) {
      console.error('Failed to complete list:', error);
    }
  };

  // 필터링된 아이템
  const filteredItems = (list?.items || []).filter(item => {
    if (filter === 'unchecked') return !item.checked;
    if (filter === 'checked') return item.checked;
    return true;
  });

  // 통계
  const totalItems = list?.items.length || 0;
  const checkedItems = list?.items.filter(i => i.checked).length || 0;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  // 카테고리별 그룹핑
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'etc';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      vegetables: '🥬',
      fruits: '🍎',
      meat: '🥩',
      seafood: '🐟',
      dairy: '🥛',
      condiments: '🧂',
      grains: '🌾',
      beverages: '🥤',
      snacks: '🍪',
      etc: '📦',
    };
    return icons[category] || '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header locale={locale} title={t('shopping.title')} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header locale={locale} title={t('shopping.title')} />

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

            {/* Progress bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {progress === 100 && totalItems > 0 && (
              <Button
                onClick={completeList}
                className="w-full mt-3"
                variant="secondary"
              >
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

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">{t('shopping.aiRecommend')}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchRecommendations}
                  disabled={recommendLoading}
                >
                  <RefreshCw className={cn('h-4 w-4', recommendLoading && 'animate-spin')} />
                </Button>
              </div>

              <div className="space-y-2">
                {recommendations.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-white/70 p-3 dark:bg-gray-800/70"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(item.category)}</span>
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="default" className="text-xs">
                          {item.quantity} {t(`units.${item.unit}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{item.reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => addRecommendedItem(item)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{getCategoryIcon(category)}</span>
                    <span className="font-semibold">{t(`categories.${category}`)}</span>
                    <Badge variant="default" className="text-xs">
                      {items.filter(i => i.checked).length}/{items.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg p-3 transition-all',
                          item.checked
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'bg-white dark:bg-gray-700'
                        )}
                      >
                        <button
                          onClick={() => toggleCheck(item.id, !item.checked)}
                          className="flex-shrink-0"
                        >
                          {item.checked ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-300" />
                          )}
                        </button>

                        <div className={cn('flex-1', item.checked && 'line-through text-gray-400')}>
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {item.quantity} {t(`units.${item.unit}`)}
                          </span>
                        </div>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('shopping.addItem')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('fridge.ingredientName')}</label>
            <Input
              value={newItem.name}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('shopping.itemNamePlaceholder')}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('fridge.quantity')}</label>
              <Input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('fridge.unit')}</label>
              <Select
                value={newItem.unit}
                onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value as Unit }))}
                options={UNITS.map(u => ({ value: u, label: t(`units.${u}`) }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('fridge.category')}</label>
            <Select
              value={newItem.category}
              onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as Category }))}
              options={CATEGORIES.map(c => ({ value: c, label: t(`categories.${c}`) }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={() => addItem(newItem)} className="flex-1" disabled={!newItem.name.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
