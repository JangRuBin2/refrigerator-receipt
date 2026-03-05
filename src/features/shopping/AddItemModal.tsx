'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { categorySchema, unitSchema } from '@/lib/validations';
import { CATEGORIES, UNITS } from '@/lib/constants';
import type { Category, Unit, ShoppingItem } from '@/types/supabase';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Partial<ShoppingItem>) => Promise<void>;
  error: string | null;
}

export function AddItemModal({ isOpen, onClose, onAdd, error }: AddItemModalProps) {
  const t = useTranslations();
  const [newItem, setNewItem] = useState<{ name: string; quantity: number; unit: Unit; category: Category }>({
    name: '',
    quantity: 1,
    unit: 'ea',
    category: 'etc',
  });

  const handleAdd = async () => {
    await onAdd(newItem);
    setNewItem({ name: '', quantity: 1, unit: 'ea', category: 'etc' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('shopping.addItem')}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
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
              onChange={(e) => setNewItem(prev => ({ ...prev, unit: unitSchema.parse(e.target.value) }))}
              options={UNITS.map(u => ({ value: u, label: t(`units.${u}`) }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('fridge.category')}</label>
          <Select
            value={newItem.category}
            onChange={(e) => setNewItem(prev => ({ ...prev, category: categorySchema.parse(e.target.value) }))}
            options={CATEGORIES.map(c => ({ value: c, label: t(`categories.${c}`) }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAdd} className="flex-1" disabled={!newItem.name.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            {t('common.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
