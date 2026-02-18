export type Mode = 'select' | 'random' | 'taste' | 'ai';

export interface AIGeneratedRecipe {
  title: string;
  description: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
  tips?: string;
}

export interface RandomResult {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  cooking_time?: number;
  difficulty?: string;
  ingredients?: { name: string; quantity?: string }[];
  tags?: string[];
}
