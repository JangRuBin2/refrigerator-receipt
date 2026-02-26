import { clearPremiumCache } from '@/hooks/usePremium';
import { useStore } from '@/store/useStore';

const STORAGE_KEY = 'fridge-mate-storage';
const TRIAL_DISMISSED_KEY = 'mk_trial_expiring_dismissed';

/**
 * Clear all user-specific data from client-side caches.
 * Call on logout and before establishing a new user session
 * to prevent data leakage between different users.
 *
 * NOTE: settings (locale, theme) are intentionally preserved
 * as they are device-level preferences, not user-specific data.
 */
export function clearAllUserData() {
  if (typeof window === 'undefined') {
    return;
  }

  clearPremiumCache();

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TRIAL_DISMISSED_KEY);

  useStore.setState({
    ingredients: [],
    favoriteRecipeIds: [],
    _dbSyncEnabled: false,
  });
}
