export type StorageType = 'refrigerated' | 'frozen' | 'room_temp';

export type Category =
  | 'vegetables'
  | 'fruits'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'condiments'
  | 'grains'
  | 'beverages'
  | 'snacks'
  | 'etc';

export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'ea' | 'pack' | 'bottle' | 'box' | 'bunch';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  storageType: StorageType;
  purchaseDate: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  imageUrl?: string;
  cookingTime: number;
  difficulty: Difficulty;
  ingredients: RecipeIngredient[];
  instructions: Record<string, string[]>;
  isFavorite?: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: Unit;
  isAvailable?: boolean;
}

export interface UserSettings {
  locale: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    expiryAlertDays: number;
  };
}

export interface ExternalRecipe {
  id: string;
  title: string;
  thumbnail?: string;
  url: string;
  source: 'youtube' | 'google';
  channelName?: string;
  snippet?: string;
}

export interface ScannedItem {
  name: string;
  quantity?: number;
  unit?: Unit;
  category?: Category;
  selected: boolean;
}
