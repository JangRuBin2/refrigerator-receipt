import { z } from 'https://esm.sh/zod@3.22.4';
import type { SupabaseClient as _SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Re-export SupabaseClient type for use across edge functions
export type SupabaseClient = _SupabaseClient;

// === Ingredient Types ===

export const IngredientSchema = z.object({
  name: z.string(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  expiry_date: z.string().optional(),
  purchase_date: z.string().optional(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

/** Minimal ingredient from DB query (name + expiry_date only) */
export const IngredientNameExpirySchema = z.object({
  name: z.string(),
  expiry_date: z.string().optional(),
});

export type IngredientNameExpiry = z.infer<typeof IngredientNameExpirySchema>;

// === Scanned Item Types (Receipt Scan) ===

export const ScannedItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  category: z.string(),
  confidence: z.number().optional(),
  estimatedExpiryDays: z.number().optional(),
});

export type ScannedItem = z.infer<typeof ScannedItemSchema>;

// === Recipe Types ===

export const RecipeIngredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  cookingTime: z.coerce.number().optional().default(30),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  servings: z.coerce.number().optional().default(2),
  ingredients: z.array(RecipeIngredientSchema),
  instructions: z.array(z.string()),
  tips: z.string().optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// === Search Result Types ===

export const YouTubeSearchItemSchema = z.object({
  id: z.object({ videoId: z.string() }),
  snippet: z.object({
    title: z.string(),
    description: z.string().optional(),
    channelTitle: z.string().optional(),
    publishedAt: z.string().optional(),
    thumbnails: z.object({
      high: z.object({ url: z.string() }).optional(),
      medium: z.object({ url: z.string() }).optional(),
      default: z.object({ url: z.string() }).optional(),
    }).optional(),
  }),
});

export type YouTubeSearchItem = z.infer<typeof YouTubeSearchItemSchema>;

export const GoogleSearchItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string().optional(),
  pagemap: z.object({
    cse_thumbnail: z.array(z.object({ src: z.string() })).optional(),
    cse_image: z.array(z.object({ src: z.string() })).optional(),
    metatags: z.array(z.record(z.string())).optional(),
  }).optional(),
});

export type GoogleSearchItem = z.infer<typeof GoogleSearchItemSchema>;

export interface SearchResult {
  id: string;
  title: string;
  thumbnail?: string;
  url: string;
  source: 'youtube' | 'google';
  channelName?: string;
  snippet?: string;
  publishedAt?: string;
}

// === Shopping Recommendation Types ===

export const ShoppingRecommendationSchema = z.object({
  name: z.string(),
  quantity: z.number().optional().default(1),
  unit: z.string().optional().default('ea'),
  category: z.string().optional().default('etc'),
  reason: z.string().optional().default(''),
});

export type ShoppingRecommendation = z.infer<typeof ShoppingRecommendationSchema>;

// === Nutrition Types ===

export const NutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sugar: z.number(),
});

export type Nutrition = z.infer<typeof NutritionSchema>;

export interface IngredientNutrition {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  nutrition: Nutrition;
}

export interface CategoryBalance {
  category: string;
  count: number;
  percentage: number;
  status: 'good' | 'low' | 'high';
}

export interface NutritionReport {
  totalNutrition: Nutrition;
  ingredients: IngredientNutrition[];
  categoryBalance: CategoryBalance[];
  score: number;
  recommendations: string[];
  period: string;
}

// === Event Log Types ===

export const ScanEventSchema = z.object({
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.string(),
});

export type ScanEvent = z.infer<typeof ScanEventSchema>;

export interface EventLogEntry {
  id: string;
  user_id: string;
  raw_text?: string;
  parsed_items?: ScannedItem[];
  status: string;
  created_at: string;
}

// === Receipt Analysis Types ===

export interface AnalysisResult {
  items: ScannedItem[];
  rawText: string;
  isValid: boolean;
  invalidReason?: string;
}

export interface ScanResult {
  items: ScannedItem[];
  rawText: string;
  mode: string;
  scanId?: string;
}
