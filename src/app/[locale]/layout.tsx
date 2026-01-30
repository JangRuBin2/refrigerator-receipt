import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { BottomNav } from '@/components/layout/BottomNav';
import { Metadata } from 'next';
import '../globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mealkeeper.app';

const titles: Record<string, string> = {
  ko: '밀키퍼 - 스마트 냉장고 관리',
  en: 'MealKeeper - Smart Fridge Management',
  ja: 'ミールキーパー - スマート冷蔵庫管理',
  zh: 'MealKeeper - 智能冰箱管理',
};

const descriptions: Record<string, string> = {
  ko: '영수증 스캔으로 식재료를 자동 등록하고, 유통기한 관리와 레시피 추천을 받아보세요.',
  en: 'Scan receipts to auto-register ingredients, manage expiry dates, and get recipe recommendations.',
  ja: 'レシートスキャンで食材を自動登録、賞味期限管理とレシピ提案を受けましょう。',
  zh: '扫描收据自动登记食材，管理保质期并获取食谱推荐。',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const title = titles[locale] || titles.ko;
  const description = descriptions[locale] || descriptions.ko;

  return {
    title: {
      default: title,
      template: `%s | 밀키퍼`,
    },
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ko: '/ko',
        en: '/en',
        ja: '/ja',
        zh: '/zh',
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: '밀키퍼',
      locale: locale === 'zh' ? 'zh_CN' : locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f97316" />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-gray-50 font-sans antialiased dark:bg-gray-900">
        <NextIntlClientProvider messages={messages}>
          <div className="mx-auto min-h-screen max-w-lg bg-white shadow-lg dark:bg-gray-800">
            <main className="pb-20">{children}</main>
            <BottomNav locale={locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
