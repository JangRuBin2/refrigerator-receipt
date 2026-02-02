import { z } from 'zod';

// Enum types
export const categorySchema = z.enum([
  'vegetables', 'fruits', 'meat', 'seafood', 'dairy',
  'condiments', 'grains', 'beverages', 'snacks', 'etc'
]);

export const unitSchema = z.enum([
  'g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'
]);

export const storageTypeSchema = z.enum([
  'refrigerated', 'frozen', 'room_temp'
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

// Ingredient schemas
export const ingredientCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: categorySchema,
  quantity: z.number().positive(),
  unit: unitSchema,
  storage_type: storageTypeSchema,
  purchase_date: z.string().optional(),
  expiry_date: z.string(),
});

export const ingredientUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: categorySchema.optional(),
  quantity: z.number().positive().optional(),
  unit: unitSchema.optional(),
  storage_type: storageTypeSchema.optional(),
  purchase_date: z.string().optional(),
  expiry_date: z.string().optional(),
});

// Favorite schema
export const favoriteSchema = z.object({
  recipe_id: z.string().uuid(),
});

// Shopping item schema
export const shoppingItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive().optional().default(1),
  unit: unitSchema.optional().default('ea'),
  category: categorySchema.optional().default('etc'),
});

export const shoppingAddSchema = z.object({
  items: z.array(shoppingItemSchema).min(1),
  listId: z.string().uuid().optional(),
});

export const shoppingUpdateSchema = z.object({
  listId: z.string().uuid(),
  itemId: z.string().uuid(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    quantity: z.number().positive().optional(),
    unit: unitSchema.optional(),
    category: categorySchema.optional(),
    checked: z.boolean().optional(),
  }),
});

// AI Recipe schema
export const aiRecipeGenerateSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  preferences: z.object({
    cookingTime: z.enum(['quick', 'medium', 'long']).optional(),
    difficulty: difficultySchema.optional(),
    cuisine: z.string().optional(),
  }).optional(),
  locale: z.string().optional(),
});

export const aiRecipeSaveSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  cookingTime: z.number().positive(),
  difficulty: difficultySchema,
  servings: z.number().positive(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string(),
  })),
  instructions: z.array(z.string()),
  tips: z.string().optional(),
  locale: z.string().optional(),
});

// Crawl schema
export const crawlSchema = z.object({
  type: z.enum(['popular', 'search']),
  keywords: z.string().optional(),
  limit: z.number().positive().max(100).optional(),
}).refine(
  (data) => data.type !== 'search' || (data.keywords && data.keywords.length > 0),
  { message: 'keywords is required for search type' }
);

// Type exports
export type IngredientCreate = z.infer<typeof ingredientCreateSchema>;
export type IngredientUpdate = z.infer<typeof ingredientUpdateSchema>;
export type Favorite = z.infer<typeof favoriteSchema>;
export type ShoppingAdd = z.infer<typeof shoppingAddSchema>;
export type ShoppingUpdate = z.infer<typeof shoppingUpdateSchema>;
export type AiRecipeGenerate = z.infer<typeof aiRecipeGenerateSchema>;
export type AiRecipeSave = z.infer<typeof aiRecipeSaveSchema>;
export type CrawlRequest = z.infer<typeof crawlSchema>;
