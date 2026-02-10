'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { getIngredients } from '@/lib/api/ingredients';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function IngredientSyncProvider() {
  const { setIngredients, setDbSyncEnabled, ingredients } = useStore();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current || !isSupabaseConfigured()) return;

    const syncFromDb = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Enable DB sync for future operations
        setDbSyncEnabled(true);

        // Load from DB
        const dbIngredients = await getIngredients();

        if (dbIngredients.length > 0) {
          // DB has data - use DB as source of truth
          setIngredients(dbIngredients);
        } else if (ingredients.length > 0) {
          // DB is empty but local has data - push local to DB
          // This handles the migration case
          const { createIngredient } = await import('@/lib/api/ingredients');
          for (const item of ingredients) {
            try {
              await createIngredient({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                storage_type: item.storageType,
                purchase_date: item.purchaseDate,
                expiry_date: item.expiryDate,
              });
            } catch {
              // Skip items that fail to sync
            }
          }
          // Reload from DB to get proper IDs
          const refreshed = await getIngredients();
          if (refreshed.length > 0) {
            setIngredients(refreshed);
          }
        }

        hasSynced.current = true;
      } catch {
        // Sync failed, keep using local data
      }
    };

    syncFromDb();
  }, [setIngredients, setDbSyncEnabled, ingredients]);

  return null;
}
