import type { Recipe, RecipeIngredient } from '@/types';

export interface RecipeWithAvailability extends Recipe {
  matchRate: number;
  availableCount: number;
  isFavorite: boolean;
  ingredientsWithStatus: (RecipeIngredient & { isAvailable: boolean })[];
}

export type RecipeFilter = 'all' | 'available' | 'favorites';
