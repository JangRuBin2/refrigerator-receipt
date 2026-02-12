'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Search, Trash2, Edit2, Package, Snowflake, Sun, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet, BottomSheetActions } from '@/components/ui/BottomSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { getDaysUntilExpiry, getExpiryColor, calculateExpiryDate, cn } from '@/lib/utils';
import { spring, listItem } from '@/lib/animations';
import type { Ingredient, StorageType, Category, Unit } from '@/types';

const STORAGE_TYPES: { type: StorageType | 'all'; icon: typeof Package }[] = [
  { type: 'all', icon: Package },
  { type: 'refrigerated', icon: Snowflake },
  { type: 'frozen', icon: Snowflake },
  { type: 'room_temp', icon: Sun },
];

const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

export default function FridgePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useStore();

  const [filter, setFilter] = useState<StorageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetables' as Category,
    quantity: '',
    unit: 'g' as Unit,
    storageType: 'refrigerated' as StorageType,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });

  // Filter ingredients
  const filteredIngredients = ingredients
    .filter((item) => filter === 'all' || item.storageType === filter)
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map((item) => ({
      ...item,
      daysLeft: getDaysUntilExpiry(item.expiryDate),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Group by category
  const groupedIngredients = filteredIngredients.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<Category, typeof filteredIngredients>);

  const handleOpenSheet = (item?: Ingredient) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        storageType: item.storageType,
        purchaseDate: item.purchaseDate,
        expiryDate: item.expiryDate,
      });
    } else {
      setEditingItem(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        name: '',
        category: 'vegetables',
        quantity: '',
        unit: 'g',
        storageType: 'refrigerated',
        purchaseDate: today,
        expiryDate: calculateExpiryDate(today, 'vegetables', 'refrigerated'),
      });
    }
    setIsSheetOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const ingredientData = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit,
      storageType: formData.storageType,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate || calculateExpiryDate(formData.purchaseDate, formData.category, formData.storageType),
    };

    if (editingItem) {
      updateIngredient(editingItem.id, ingredientData);
      toast.success(t('common.success'));
    } else {
      addIngredient(ingredientData);
      toast.success(t('common.success'));
    }

    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteIngredient(deleteTarget);
      toast.success(t('common.delete') + ' ' + t('common.success'));
      setDeleteTarget(null);
    }
  };

  const handleCategoryChange = (category: Category) => {
    setFormData((prev) => ({
      ...prev,
      category,
      expiryDate: calculateExpiryDate(prev.purchaseDate, category, prev.storageType),
    }));
  };

  const handleStorageChange = (storageType: StorageType) => {
    setFormData((prev) => ({
      ...prev,
      storageType,
      expiryDate: calculateExpiryDate(prev.purchaseDate, prev.category, storageType),
    }));
  };

  return (
    <PremiumGate feature="fridge_management">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      {/* Search - Fixed at top */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm dark:bg-gray-900/95 p-toss-md pb-0">
        <div className="relative">
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
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Tabs - Horizontal scroll */}
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

      <div className="p-toss-md pt-0 pb-24 space-y-toss-md">
        {/* Ingredients List */}
        {filteredIngredients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <p className="toss-body1 mt-toss-md text-gray-500">{t('fridge.empty')}</p>
            <p className="toss-caption mt-toss-xs">{t('fridge.addFirst')}</p>
            <Button
              onClick={() => handleOpenSheet()}
              className="mt-toss-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('fridge.addIngredient')}
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {Object.entries(groupedIngredients).map(([category, items], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ ...spring.gentle, delay: categoryIndex * 0.05 }}
              >
                <h3 className="toss-body2 font-semibold text-gray-500 mb-toss-sm px-1">
                  {t(`categories.${category}`)} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      variants={listItem}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: itemIndex * 0.03 }}
                      className="toss-card"
                    >
                      <div className="flex items-center gap-toss-sm">
                        <div className="flex-1 min-w-0">
                          <p className="toss-body1 font-medium truncate">{item.name}</p>
                          <p className="toss-caption">
                            {item.quantity} {t(`units.${item.unit}`)}
                          </p>
                        </div>
                        <Badge className={getExpiryColor(item.daysLeft)}>
                          {item.daysLeft < 0
                            ? t('fridge.expired')
                            : item.daysLeft === 0
                              ? t('fridge.today')
                              : t('fridge.dDay', { days: item.daysLeft })}
                        </Badge>
                        <div className="flex gap-1">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenSheet(item)}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(item.id)}
                            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Animated FAB */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.bouncy}
        className="fixed bottom-24 right-4 z-20"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenSheet()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </motion.div>

      {/* Add/Edit BottomSheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingItem ? t('fridge.editIngredient') : t('fridge.addIngredient')}
        snapPoints={[75]}
      >
        <div className="space-y-toss-md">
          <Input
            label={t('fridge.ingredientName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('fridge.ingredientName')}
          />

          <Select
            label={t('fridge.category')}
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value as Category)}
            options={CATEGORIES.map((cat) => ({
              value: cat,
              label: t(`categories.${cat}`),
            }))}
          />

          <div className="grid grid-cols-2 gap-toss-sm">
            <Input
              label={t('fridge.quantity')}
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="1"
            />
            <Select
              label={t('fridge.unit')}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as Unit })}
              options={UNITS.map((unit) => ({
                value: unit,
                label: t(`units.${unit}`),
              }))}
            />
          </div>

          <Select
            label={t('fridge.storageType')}
            value={formData.storageType}
            onChange={(e) => handleStorageChange(e.target.value as StorageType)}
            options={[
              { value: 'refrigerated', label: t('fridge.refrigerated') },
              { value: 'frozen', label: t('fridge.frozen') },
              { value: 'room_temp', label: t('fridge.roomTemp') },
            ]}
          />

          <div className="grid grid-cols-2 gap-toss-sm">
            <Input
              label={t('fridge.purchaseDate')}
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
            <Input
              label={t('fridge.expiryDate')}
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <BottomSheetActions>
            <Button onClick={handleSubmit} className="w-full">
              {t('common.save')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              className="w-full"
            >
              {t('common.cancel')}
            </Button>
          </BottomSheetActions>
        </div>
      </BottomSheet>

      {/* Delete Confirm Dialog */}
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
    </PremiumGate>
  );
}
