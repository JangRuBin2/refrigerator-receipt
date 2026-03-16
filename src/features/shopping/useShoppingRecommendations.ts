'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { categorySchema, unitSchema } from '@/lib/validations';
import { useStore } from '@/store/useStore';
import { getIngredients } from '@/lib/api/ingredients';
import { getShoppingRecommendations } from '@/lib/api/shopping';

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

export type RecommendedItem = z.infer<typeof recommendedItemSchema>;

export function useShoppingRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
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
      setError(true);
      setRecommendations([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  const removeItem = useCallback((name: string) => {
    setRecommendations(prev => prev.filter(r => r.name !== name));
  }, []);

  return {
    recommendations,
    loading,
    error,
    fetched,
    fetch,
    removeItem,
  };
}
