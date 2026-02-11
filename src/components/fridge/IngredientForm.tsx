'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { calculateExpiryDate } from '@/lib/utils';
import type { Category, Unit, StorageType } from '@/types';

const CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

interface IngredientFormProps {
  onSuccess?: () => void;
}

export function IngredientForm({ onSuccess }: IngredientFormProps) {
  const t = useTranslations();
  const { addIngredient } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetables' as Category,
    quantity: '',
    unit: 'g' as Unit,
    storageType: 'refrigerated' as StorageType,
    purchaseDate: today,
    expiryDate: calculateExpiryDate(today, 'vegetables', 'refrigerated'),
  });

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

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    addIngredient({
      name: formData.name.trim(),
      category: formData.category,
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit,
      storageType: formData.storageType,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate || calculateExpiryDate(formData.purchaseDate, formData.category, formData.storageType),
    });

    toast.success(t('common.success'));

    // Reset form
    setFormData({
      name: '',
      category: 'vegetables',
      quantity: '',
      unit: 'g',
      storageType: 'refrigerated',
      purchaseDate: today,
      expiryDate: calculateExpiryDate(today, 'vegetables', 'refrigerated'),
    });

    onSuccess?.();
  };

  return (
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

      <Button onClick={handleSubmit} className="w-full" disabled={!formData.name.trim()}>
        {t('fridge.addIngredient')}
      </Button>
    </div>
  );
}
