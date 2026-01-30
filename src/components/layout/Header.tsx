'use client';

import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  locale: string;
  showSettings?: boolean;
  title?: string;
}

export function Header({ locale, showSettings = true, title }: HeaderProps) {
  const t = useTranslations('common');

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {title || t('appName')}
          </h1>
        </div>
        {showSettings && (
          <Link
            href={`/${locale}/settings`}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Settings className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
