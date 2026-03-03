'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('settings');

  return (
    <footer className="px-4 pb-24 pt-6">
      <div className="space-y-1 text-xs text-gray-400 dark:text-gray-500">
        <p>{t('businessName')}: 인프리 | {t('representative')}: 장루빈</p>
        <p>{t('businessNumber')}: 790-39-01572</p>
        <p>{t('address')}: 대전광역시 유성구 대정로28번안길 80</p>
        <p>{t('contact')}: wkdfnqls2465@gmail.com</p>
        <p className="pt-2 text-gray-300 dark:text-gray-600">
          &copy; {new Date().getFullYear()} MealKeeper. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
