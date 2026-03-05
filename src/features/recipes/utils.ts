import type { Recipe, Ingredient } from '@/types';
import type { RecipeWithAvailability } from './types';

export { getDifficultyColor } from '@/lib/constants';

export const enrichRecipeWithAvailability = (
  recipe: Recipe,
  ingredients: Ingredient[],
  favoriteRecipeIds: string[],
): RecipeWithAvailability => {
  const availableIngredients = recipe.ingredients.filter((ri) =>
    ingredients.some((i) => i.name.includes(ri.name) || ri.name.includes(i.name))
  );
  const totalIngredients = recipe.ingredients.length || 1;
  const matchRate = Math.round((availableIngredients.length / totalIngredients) * 100);

  return {
    ...recipe,
    matchRate,
    availableCount: availableIngredients.length,
    isFavorite: favoriteRecipeIds.includes(recipe.id),
    ingredientsWithStatus: recipe.ingredients.map((ri) => ({
      ...ri,
      isAvailable: ingredients.some((i) => i.name.includes(ri.name) || ri.name.includes(i.name)),
    })),
  };
};
