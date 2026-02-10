'use client';

import { useTranslations } from 'next-intl';

export default function TermsPage() {
  const t = useTranslations('terms');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article1.title')}
            </h2>
            <p>{t('article1.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article2.title')}
            </h2>
            <p>{t('article2.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article3.title')}
            </h2>
            <p>{t('article3.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article4.title')}
            </h2>
            <p>{t('article4.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article5.title')}
            </h2>
            <p>{t('article5.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article6.title')}
            </h2>
            <p>{t('article6.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article7.title')}
            </h2>
            <p>{t('article7.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article8.title')}
            </h2>
            <p>{t('article8.content')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('article9.title')}
            </h2>
            <p>{t('article9.content')}</p>
          </section>

          <p className="mt-12 text-gray-500 dark:text-gray-400">
            {t('effectiveDate')}
          </p>
        </div>
      </div>
    </div>
  );
}
