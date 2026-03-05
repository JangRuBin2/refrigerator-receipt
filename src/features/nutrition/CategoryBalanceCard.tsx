'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/constants';

interface CategoryBalance {
  category: string;
  count: number;
  percentage: number;
  status: 'good' | 'low' | 'high';
}

interface CategoryBalanceCardProps {
  categories: CategoryBalance[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'good':
      return <Minus className="h-4 w-4 text-green-500" />;
    case 'low':
      return <TrendingDown className="h-4 w-4 text-orange-500" />;
    case 'high':
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

export function CategoryBalanceCard({ categories }: CategoryBalanceCardProps) {
  const t = useTranslations();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good': return t('nutrition.statusGood');
      case 'low': return t('nutrition.statusLow');
      case 'high': return t('nutrition.statusHigh');
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('nutrition.categoryBalance')}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-4">{t('nutrition.noData')}</p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(cat.category)}</span>
                    <span className="font-medium">{t(`categories.${cat.category}`)}</span>
                    <Badge
                      variant={cat.status === 'good' ? 'success' : cat.status === 'low' ? 'warning' : 'danger'}
                      className="text-xs"
                    >
                      {getStatusText(cat.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(cat.status)}
                    <span className="text-sm font-medium">{cat.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      cat.status === 'good' && 'bg-green-500',
                      cat.status === 'low' && 'bg-orange-500',
                      cat.status === 'high' && 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
