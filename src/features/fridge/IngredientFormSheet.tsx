'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BottomSheet, BottomSheetActions } from '@/components/ui/BottomSheet';
import { toast } from '@/store/useToastStore';
import { useStore } from '@/store/useStore';
import { calculateExpiryDate } from '@/lib/utils';
import { CATEGORIES, UNITS } from '@/lib/constants';
import type { Ingredient, StorageType, Category, Unit } from '@/types';

interface FormData {
  name: string;
  category: Category;
  quantity: string;
  unit: Unit;
  storageType: StorageType;
  purchaseDate: string;
  expiryDate: string;
}

function createInitialFormData(item?: Ingredient): FormData {
  if (item) {
    return {
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      storageType: item.storageType,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate,
    };
  }
  const today = new Date().toISOString().split('T')[0];
  return {
    name: '',
    category: 'vegetables',
    quantity: '',
    unit: 'g',
    storageType: 'refrigerated',
    purchaseDate: today,
    expiryDate: calculateExpiryDate(today, 'vegetables', 'refrigerated'),
  };
}

interface IngredientFormSheetProps {
  isOpen: boolean;
  editingItem: Ingredient | null;
  onClose: () => void;
}

export function IngredientFormSheet({ isOpen, editingItem, onClose }: IngredientFormSheetProps) {
  const t = useTranslations();
  const { addIngredient, updateIngredient } = useStore();
  const [formData, setFormData] = useState<FormData>(() => createInitialFormData(editingItem ?? undefined));

  // editingItem이 변경되면 폼 데이터 리셋
  // BottomSheet가 열릴 때마다 새 editingItem이 전달되므로 key prop으로 리셋 처리

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
    toast.success(t('common.success'));
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
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
          onChange={(e) => {
            const val = e.target.value;
            if (CATEGORIES.includes(val as Category)) handleCategoryChange(val as Category);
          }}
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
            onChange={(e) => {
              const val = e.target.value;
              if (UNITS.includes(val as Unit)) setFormData({ ...formData, unit: val as Unit });
            }}
            options={UNITS.map((unit) => ({
              value: unit,
              label: t(`units.${unit}`),
            }))}
          />
        </div>

        <Select
          label={t('fridge.storageType')}
          value={formData.storageType}
          onChange={(e) => {
            const val = e.target.value;
            if (['refrigerated', 'frozen', 'room_temp'].includes(val)) handleStorageChange(val as StorageType);
          }}
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
            onClick={onClose}
            className="w-full"
          >
            {t('common.cancel')}
          </Button>
        </BottomSheetActions>
      </div>
    </BottomSheet>
  );
}
