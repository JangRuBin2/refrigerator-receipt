import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['ko', 'en', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export const routing = defineRouting({
  locales,
  defaultLocale: 'ko',
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
