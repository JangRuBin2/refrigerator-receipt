export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
      };
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          quantity: number;
          unit: string;
          storage_type: string;
          purchase_date: string;
          expiry_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          quantity: number;
          unit: string;
          storage_type: string;
          purchase_date: string;
          expiry_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          storage_type?: string;
          purchase_date?: string;
          expiry_date?: string;
          created_at?: string;
          updated_at?: string;
        };
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
          difficulty: string | null;
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
          difficulty?: string | null;
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
          difficulty?: string | null;
          servings?: number | null;
          ingredients?: Json;
          instructions?: Json;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
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
      };
      receipt_scans: {
        Row: {
          id: string;
          user_id: string;
          image_url: string | null;
          raw_text: string | null;
          parsed_items: Json | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url?: string | null;
          raw_text?: string | null;
          parsed_items?: Json | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string | null;
          raw_text?: string | null;
          parsed_items?: Json | null;
          status?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
