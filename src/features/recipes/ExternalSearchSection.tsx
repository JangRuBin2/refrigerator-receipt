'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ExternalSearchSection() {
  const t = useTranslations();

  return (
    <Card className="opacity-60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Search className="h-5 w-5 text-gray-400" />
            {t('recipe.externalRecommend')}
          </h2>
          <Badge variant="default" className="text-xs">
            {t('common.comingSoon')}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          {t('recipe.externalSearchDesc')}
        </p>
      </CardContent>
    </Card>
  );
}
