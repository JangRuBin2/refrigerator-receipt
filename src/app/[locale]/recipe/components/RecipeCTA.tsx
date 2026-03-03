'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Check, ChefHat } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { addFavorite } from '@/lib/api/favorites';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';

interface RecipeCTAProps {
  recipeId: string;
  locale: string;
}

export function RecipeCTA({ recipeId, locale }: RecipeCTAProps) {
  const t = useTranslations();
  const { toggleFavorite } = useStore();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const handleSave = async () => {
    if (saving || saved) return;

    setSaving(true);
    try {
      await addFavorite(recipeId);
      toggleFavorite(recipeId);
      setSaved(true);
    } catch (err) {
      if (err instanceof Error && err.message === 'Already favorited') {
        setSaved(true);
      } else {
        toast.error(t('recommend.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoggedIn === null) {
    return (
      <div className="space-y-3">
        <Skeleton variant="card" className="h-24" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20">
        <CardContent className="p-5 text-center">
          <ChefHat className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <h3 className="text-lg font-bold">{t('share.ctaTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('share.ctaDescription')}</p>
          <Button
            onClick={() => { window.location.href = `/${locale}/login/`; }}
            className="mt-4 w-full"
            variant="primary"
          >
            {t('share.ctaButton')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleSave}
        disabled={saving || saved}
        variant={saved ? 'primary' : 'outline'}
        className={saved ? 'bg-red-500 hover:bg-red-500 text-white w-full' : 'w-full'}
      >
        {saving ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
        ) : saved ? (
          <Check className="mr-1.5 h-4 w-4" />
        ) : (
          <Heart className="mr-1.5 h-4 w-4" />
        )}
        {saved ? t('share.saved') : t('share.saveRecipe')}
      </Button>
    </div>
  );
}
