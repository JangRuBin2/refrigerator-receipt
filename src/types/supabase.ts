export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types matching DB constraints
export type Category = 'vegetables' | 'fruits' | 'meat' | 'seafood' | 'dairy' | 'condiments' | 'grains' | 'beverages' | 'snacks' | 'etc';
export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'ea' | 'pack' | 'bottle' | 'box' | 'bunch';
export type StorageType = 'refrigerated' | 'frozen' | 'room_temp';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Plan = 'free' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentProvider = 'stripe' | 'toss' | 'google_play' | 'app_store';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: Category;
          quantity: number;
          unit: Unit;
          storage_type: StorageType;
          purchase_date: string;
          expiry_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: Category;
          quantity: number;
          unit: Unit;
          storage_type: StorageType;
          purchase_date: string;
          expiry_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: Category;
          quantity?: number;
          unit?: Unit;
          storage_type?: StorageType;
          purchase_date?: string;
          expiry_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ingredients_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      recipes: {
        Row: {
          id: string;
          external_id: string | null;
          source: string;
          source_url: string | null;
          title: Json;
          description: Json | null;
          image_url: string | null;
          cooking_time: number | null;
          difficulty: Difficulty | null;
          servings: number | null;
          ingredients: Json;
          instructions: Json;
          tags: string[] | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          source: string;
          source_url?: string | null;
          title: Json;
          description?: Json | null;
          image_url?: string | null;
          cooking_time?: number | null;
          difficulty?: Difficulty | null;
          servings?: number | null;
          ingredients: Json;
          instructions: Json;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          source?: string;
          source_url?: string | null;
          title?: Json;
          description?: Json | null;
          image_url?: string | null;
          cooking_time?: number | null;
          difficulty?: Difficulty | null;
          servings?: number | null;
          ingredients?: Json;
          instructions?: Json;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_favorites_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_favorites_recipe_id_fkey';
            columns: ['recipe_id'];
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          }
        ];
      };
      receipt_scans: {
        Row: {
          id: string;
          user_id: string;
          image_url: string | null;
          raw_text: string | null;
          parsed_items: Json | null;
          status: ScanStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url?: string | null;
          raw_text?: string | null;
          parsed_items?: Json | null;
          status?: ScanStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string | null;
          raw_text?: string | null;
          parsed_items?: Json | null;
          status?: ScanStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'receipt_scans_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: Plan;
          billing_cycle: BillingCycle | null;
          started_at: string;
          expires_at: string | null;
          canceled_at: string | null;
          payment_provider: PaymentProvider | null;
          payment_id: string | null;
          auto_renew: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: Plan;
          billing_cycle?: BillingCycle | null;
          started_at?: string;
          expires_at?: string | null;
          canceled_at?: string | null;
          payment_provider?: PaymentProvider | null;
          payment_id?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: Plan;
          billing_cycle?: BillingCycle | null;
          started_at?: string;
          expires_at?: string | null;
          canceled_at?: string | null;
          payment_provider?: PaymentProvider | null;
          payment_id?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      shopping_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          items: Json;
          is_active: boolean;
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          items?: Json;
          is_active?: boolean;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          items?: Json;
          is_active?: boolean;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_lists_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: {
      category: Category;
      unit: Unit;
      storage_type: StorageType;
      difficulty: Difficulty;
      scan_status: ScanStatus;
      plan: Plan;
      billing_cycle: BillingCycle;
      payment_provider: PaymentProvider;
    };
    CompositeTypes: Record<string, unknown>;
  };
};

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Profile = Tables<'profiles'>;
export type Ingredient = Tables<'ingredients'>;
export type Recipe = Tables<'recipes'>;
export type UserFavorite = Tables<'user_favorites'>;
export type ReceiptScan = Tables<'receipt_scans'>;
export type Subscription = Tables<'subscriptions'>;
export type ShoppingList = Tables<'shopping_lists'>;

// Shopping list item type
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  checked: boolean;
  addedAt: string;
}
