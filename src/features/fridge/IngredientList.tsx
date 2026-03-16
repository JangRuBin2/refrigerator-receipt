'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Edit2, Trash2, Package, Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { spring, listItem } from '@/lib/animations';
import { getExpiryColor } from '@/lib/utils';
import type { Ingredient } from '@/types';

interface IngredientWithDays extends Ingredient {
  daysLeft: number;
}

interface IngredientListProps {
  ingredients: IngredientWithDays[];
  groupedIngredients: Record<string, IngredientWithDays[]>;
  onEdit: (item: Ingredient) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function IngredientList({
  ingredients,
  groupedIngredients,
  onEdit,
  onDelete,
  onAdd,
}: IngredientListProps) {
  const t = useTranslations();

  if (ingredients.length === 0) {
    return (
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
        <Button onClick={onAdd} className="mt-toss-md">
          <Plus className="mr-2 h-4 w-4" />
          {t('fridge.addIngredient')}
        </Button>
      </motion.div>
    );
  }

  return (
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
                      onClick={() => onEdit(item)}
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                      aria-label={t('common.edit')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(item.id)}
                      className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      aria-label={t('common.delete')}
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
  );
}
