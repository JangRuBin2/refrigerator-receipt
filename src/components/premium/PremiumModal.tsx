'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Crown, Camera, Sparkles, BarChart3, ShoppingCart, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { PremiumFeature } from '@/hooks/usePremium';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: PremiumFeature;
}

const featureIcons: Record<PremiumFeature, React.ReactNode> = {
  receipt_scan: <Camera className="h-6 w-6" />,
  external_recipe_search: <Search className="h-6 w-6" />,
  ai_recipe: <Sparkles className="h-6 w-6" />,
  nutrition_analysis: <BarChart3 className="h-6 w-6" />,
  smart_shopping: <ShoppingCart className="h-6 w-6" />,
};

const featureKeys: Record<PremiumFeature, string> = {
  receipt_scan: 'unlimitedScan',
  external_recipe_search: 'externalSearch',
  ai_recipe: 'aiRecipe',
  nutrition_analysis: 'nutritionAnalysis',
  smart_shopping: 'smartShopping',
};

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const handleUpgrade = () => {
    onClose();
    router.push(`/${locale}/pricing`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-sm"
    >
      <div className="text-center">
        {/* Crown Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30">
          <Crown className="h-8 w-8 text-yellow-500" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {t('pricing.premiumRequired')}
        </h2>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t('pricing.premiumRequiredDescription')}
        </p>

        {/* Feature Highlight */}
        {feature && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40">
                {featureIcons[feature]}
              </div>
              <span className="font-medium">
                {t(`pricing.feature.${featureKeys[feature]}`)}
              </span>
            </div>
          </div>
        )}

        {/* Premium Benefits */}
        <div className="mb-6 space-y-2 text-left">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Premium 혜택
          </p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-500" />
              <span>무제한 영수증 스캔</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>AI 맞춤 레시피 생성</span>
            </li>
            <li className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <span>영양 분석 리포트</span>
            </li>
            <li className="flex items-center gap-2">
              <Search className="h-4 w-4 text-red-500" />
              <span>외부 레시피 검색</span>
            </li>
          </ul>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-primary-600">
            {t('pricing.monthlyPrice')}
            <span className="text-sm font-normal text-gray-500">/{t('pricing.month')}</span>
          </p>
          <p className="text-xs text-gray-400">
            {t('pricing.yearlyPrice')}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <Button onClick={handleUpgrade} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            {t('pricing.upgradeToPremium')}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
