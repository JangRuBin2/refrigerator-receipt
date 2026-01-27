import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient, Recipe, UserSettings } from '@/types';
import { generateId } from '@/lib/utils';

interface FridgeStore {
  // Ingredients
  ingredients: Ingredient[];
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIngredient: (id: string, ingredient: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  clearIngredients: () => void;

  // Favorites
  favoriteRecipeIds: string[];
  toggleFavorite: (recipeId: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useStore = create<FridgeStore>()(
  persist(
    (set) => ({
      // Ingredients
      ingredients: [],
      addIngredient: (ingredient) =>
        set((state) => ({
          ingredients: [
            ...state.ingredients,
            {
              ...ingredient,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateIngredient: (id, ingredient) =>
        set((state) => ({
          ingredients: state.ingredients.map((item) =>
            item.id === id
              ? { ...item, ...ingredient, updatedAt: new Date().toISOString() }
              : item
          ),
        })),
      deleteIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((item) => item.id !== id),
        })),
      clearIngredients: () => set({ ingredients: [] }),

      // Favorites
      favoriteRecipeIds: [],
      toggleFavorite: (recipeId) =>
        set((state) => ({
          favoriteRecipeIds: state.favoriteRecipeIds.includes(recipeId)
            ? state.favoriteRecipeIds.filter((id) => id !== recipeId)
            : [...state.favoriteRecipeIds, recipeId],
        })),

      // Settings
      settings: {
        locale: 'ko',
        theme: 'system',
        notifications: {
          enabled: true,
          expiryAlertDays: 3,
        },
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'fridge-mate-storage',
    }
  )
);
