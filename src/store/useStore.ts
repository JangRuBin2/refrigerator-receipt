import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient, UserSettings } from '@/types';
import { generateId } from '@/lib/utils';
import {
  createIngredient as createIngredientApi,
  updateIngredientApi,
  deleteIngredientApi,
  clearIngredientsApi,
} from '@/lib/api/ingredients';

interface FridgeStore {
  // Ingredients
  ingredients: Ingredient[];
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIngredient: (id: string, ingredient: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  clearIngredients: () => void;
  setIngredients: (ingredients: Ingredient[]) => void;

  // DB sync state
  _dbSyncEnabled: boolean;
  setDbSyncEnabled: (enabled: boolean) => void;

  // Favorites
  favoriteRecipeIds: string[];
  toggleFavorite: (recipeId: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useStore = create<FridgeStore>()(
  persist(
    (set, get) => ({
      // Ingredients
      ingredients: [],
      addIngredient: (ingredient) => {
        const newIngredient: Ingredient = {
          ...ingredient,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update local state immediately
        set((state) => ({
          ingredients: [...state.ingredients, newIngredient],
        }));

        // Sync to DB in background
        if (get()._dbSyncEnabled) {
          createIngredientApi({
            name: newIngredient.name,
            category: newIngredient.category,
            quantity: newIngredient.quantity,
            unit: newIngredient.unit,
            storage_type: newIngredient.storageType,
            purchase_date: newIngredient.purchaseDate,
            expiry_date: newIngredient.expiryDate,
          }).then((dbItem) => {
            // Replace local ID with DB ID
            set((state) => ({
              ingredients: state.ingredients.map((item) =>
                item.id === newIngredient.id
                  ? { ...item, id: dbItem.id }
                  : item
              ),
            }));
          }).catch(() => {
            // DB sync failed, local data still intact
          });
        }
      },
      updateIngredient: (id, ingredient) => {
        set((state) => ({
          ingredients: state.ingredients.map((item) =>
            item.id === id
              ? { ...item, ...ingredient, updatedAt: new Date().toISOString() }
              : item
          ),
        }));

        // Sync to DB in background
        if (get()._dbSyncEnabled) {
          const dbUpdate: Record<string, unknown> = {};
          if (ingredient.name !== undefined) dbUpdate.name = ingredient.name;
          if (ingredient.category !== undefined) dbUpdate.category = ingredient.category;
          if (ingredient.quantity !== undefined) dbUpdate.quantity = ingredient.quantity;
          if (ingredient.unit !== undefined) dbUpdate.unit = ingredient.unit;
          if (ingredient.storageType !== undefined) dbUpdate.storage_type = ingredient.storageType;
          if (ingredient.purchaseDate !== undefined) dbUpdate.purchase_date = ingredient.purchaseDate;
          if (ingredient.expiryDate !== undefined) dbUpdate.expiry_date = ingredient.expiryDate;

          updateIngredientApi(id, dbUpdate).catch(() => {
            // DB sync failed silently
          });
        }
      },
      deleteIngredient: (id) => {
        set((state) => ({
          ingredients: state.ingredients.filter((item) => item.id !== id),
        }));

        // Sync to DB in background
        if (get()._dbSyncEnabled) {
          deleteIngredientApi(id).catch(() => {
            // DB sync failed silently
          });
        }
      },
      clearIngredients: () => {
        set({ ingredients: [] });

        // Sync to DB in background
        if (get()._dbSyncEnabled) {
          clearIngredientsApi().catch(() => {
            // DB sync failed silently
          });
        }
      },
      setIngredients: (ingredients) => set({ ingredients }),

      // DB sync
      _dbSyncEnabled: false,
      setDbSyncEnabled: (enabled) => set({ _dbSyncEnabled: enabled }),

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
      partialize: (state) => ({
        ingredients: state.ingredients,
        favoriteRecipeIds: state.favoriteRecipeIds,
        settings: state.settings,
      }),
    }
  )
);
