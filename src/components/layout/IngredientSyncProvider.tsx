'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getIngredients, createIngredient } from '@/lib/api/ingredients';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function IngredientSyncProvider() {
  const setIngredients = useStore((s) => s.setIngredients);
  const setDbSyncEnabled = useStore((s) => s.setDbSyncEnabled);
  const hasSynced = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    // Skip on login page to avoid interfering with auth flow
    if (pathname?.includes('/login')) return;
    if (hasSynced.current || !isSupabaseConfigured()) return;

    const syncFromDb = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Enable DB sync for future operations
        setDbSyncEnabled(true);
        hasSynced.current = true;

        // Load from DB
        const dbIngredients = await getIngredients();

        if (dbIngredients.length > 0) {
          // DB has data - use DB as source of truth
          setIngredients(dbIngredients);
        } else {
          // DB is empty - push local data to DB (migration)
          const localIngredients = useStore.getState().ingredients;
          if (localIngredients.length > 0) {
            for (const item of localIngredients) {
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
                // Skip failed items
              }
            }
            // Reload from DB to get proper IDs
            const refreshed = await getIngredients();
            if (refreshed.length > 0) {
              setIngredients(refreshed);
            }
          }
        }
      } catch {
        // Sync failed, keep using local data
      }
    };

    syncFromDb();
  }, [pathname, setIngredients, setDbSyncEnabled]);

  return null;
}
