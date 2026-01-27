'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { getDaysUntilExpiry, getExpiryColor, calculateExpiryDate, cn } from '@/lib/utils';
import type { Ingredient, StorageType, Category, Unit } from '@/types';

const STORAGE_TYPES: StorageType[] = ['refrigerated', 'frozen', 'room_temp'];
const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

export default function FridgePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useStore();

  const [filter, setFilter] = useState<StorageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);

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

  const handleOpenModal = (item?: Ingredient) => {
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
    setIsModalOpen(true);
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
    } else {
      addIngredient(ingredientData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.delete') + '?')) {
      deleteIngredient(id);
    }
  };

  // Auto-calculate expiry date when category or storage type changes
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
    <div className="min-h-screen">
      <Header locale={locale} title={t('fridge.title')} />

      <div className="space-y-4 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            )}
          >
            {t('fridge.all')}
          </button>
          {STORAGE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                filter === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {t(`fridge.${type === 'room_temp' ? 'roomTemp' : type}`)}
            </button>
          ))}
        </div>

        {/* Ingredients List */}
        {filteredIngredients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">{t('fridge.empty')}</p>
              <p className="mt-1 text-sm text-gray-400">{t('fridge.addFirst')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedIngredients).map(([category, items]) => (
              <Card key={category}>
                <CardContent className="p-4">
                  <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-300">
                    {t(`categories.${category}`)} ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} {t(`units.${item.unit}`)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getExpiryColor(item.daysLeft)}
                          >
                            {item.daysLeft < 0
                              ? t('fridge.expired')
                              : item.daysLeft === 0
                              ? t('fridge.today')
                              : t('fridge.dDay', { days: item.daysLeft })}
                          </Badge>
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Button */}
        <Button
          onClick={() => handleOpenModal()}
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? t('fridge.editIngredient') : t('fridge.addIngredient')}
        >
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-3">
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
              options={STORAGE_TYPES.map((type) => ({
                value: type,
                label: t(`fridge.${type === 'room_temp' ? 'roomTemp' : type}`),
              }))}
            />

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

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                {t('common.save')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
