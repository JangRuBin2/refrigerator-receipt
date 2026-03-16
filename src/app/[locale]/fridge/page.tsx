'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Plus, Search, Package, Snowflake, Sun, X } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { BannerAd } from '@/components/ads/BannerAd';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { getDaysUntilExpiry, cn } from '@/lib/utils';
import type { Ingredient, StorageType } from '@/types';
import { IngredientList } from '@/features/fridge/IngredientList';
import { IngredientFormSheet } from '@/features/fridge/IngredientFormSheet';

const STORAGE_TYPES: { type: StorageType | 'all'; icon: typeof Package }[] = [
  { type: 'all', icon: Package },
  { type: 'refrigerated', icon: Snowflake },
  { type: 'frozen', icon: Snowflake },
  { type: 'room_temp', icon: Sun },
];

export default function FridgePage() {
  const t = useTranslations();
  const { ingredients, deleteIngredient } = useStore();

  const [filter, setFilter] = useState<StorageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filteredIngredients = useMemo(() =>
    ingredients
      .filter((item) => filter === 'all' || item.storageType === filter)
      .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((item) => ({ ...item, daysLeft: getDaysUntilExpiry(item.expiryDate) }))
      .sort((a, b) => a.daysLeft - b.daysLeft),
    [ingredients, filter, searchQuery]
  );

  const groupedIngredients = useMemo(() =>
    filteredIngredients.reduce<Record<string, typeof filteredIngredients>>((acc, item) => ({
      ...acc,
      [item.category]: [...(acc[item.category] ?? []), item],
    }), {}),
    [filteredIngredients]
  );

  const handleOpenSheet = (item?: Ingredient) => {
    setEditingItem(item ?? null);
    setIsSheetOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteIngredient(deleteTarget);
      toast.success(t('common.delete') + ' ' + t('common.success'));
      setDeleteTarget(null);
    }
  };

  // IngredientFormSheet를 key로 리셋하여 editingItem 변경 시 폼 초기화
  const sheetKey = isSheetOpen ? (editingItem?.id ?? 'new') : 'closed';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search + Add */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm dark:bg-gray-900/95 p-toss-md pb-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-0 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOpenSheet()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm"
            aria-label={t('fridge.addIngredient')}
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto py-toss-sm scrollbar-hide">
          {STORAGE_TYPES.map(({ type, icon: Icon }) => (
            <motion.button
              key={type}
              onClick={() => setFilter(type)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                filter === type
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {type === 'all'
                ? t('fridge.all')
                : t(`fridge.${type === 'room_temp' ? 'roomTemp' : type}`)}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-toss-md pt-0 pb-8 space-y-toss-md">
        <IngredientList
          ingredients={filteredIngredients}
          groupedIngredients={groupedIngredients}
          onEdit={handleOpenSheet}
          onDelete={setDeleteTarget}
          onAdd={() => handleOpenSheet()}
        />
        <BannerAd className="mt-4" />
      </div>

      <IngredientFormSheet
        key={sheetKey}
        isOpen={isSheetOpen}
        editingItem={editingItem}
        onClose={() => setIsSheetOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('common.delete') + '?'}
        message={t('settings.deleteWarning')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
