'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { IngredientForm } from '@/components/fridge/IngredientForm';

export default function FridgeAddPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const handleSuccess = () => {
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header locale={locale} title={t('fridge.addIngredient')} />

      <div className="p-toss-md pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-toss-md"
        >
          <div className="toss-card">
            <div className="flex items-center gap-2 mb-toss-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
                <Plus className="h-4 w-4 text-primary-600" />
              </div>
              <h2 className="toss-body1 font-semibold">{t('fridge.manualAdd')}</h2>
            </div>
            <IngredientForm onSuccess={handleSuccess} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
