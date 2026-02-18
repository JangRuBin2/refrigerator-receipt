import type { Recipe, Ingredient } from '@/types';
import type { RecipeWithAvailability } from './types';

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'hard':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

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
