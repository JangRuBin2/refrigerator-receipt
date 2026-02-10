import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { DeepLinkHandler } from '@/components/layout/DeepLinkHandler';
import { IngredientSyncProvider } from '@/components/layout/IngredientSyncProvider';
import { WebApplicationJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd';
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
  ko: '영수증 스캔으로 식재료를 자동 등록하고, 유통기한 관리와 레시피 추천을 받아보세요. AI 기반 스마트 냉장고 관리 서비스.',
  en: 'Scan receipts to auto-register ingredients, manage expiry dates, and get AI-powered recipe recommendations. Smart fridge management made easy.',
  ja: 'レシートスキャンで食材を自動登録、賞味期限管理とAIレシピ提案。スマート冷蔵庫管理アプリ。',
  zh: '扫描收据自动登记食材，管理保质期并获取AI食谱推荐。智能冰箱管理服务。',
};

const keywords: Record<string, string[]> = {
  ko: ['냉장고 관리', '영수증 스캔', '유통기한', '레시피 추천', '식재료 관리', '스마트 냉장고', '음식 낭비 줄이기', 'AI 레시피'],
  en: ['fridge management', 'receipt scan', 'expiry date', 'recipe recommendation', 'ingredient management', 'smart fridge', 'reduce food waste', 'AI recipes'],
  ja: ['冷蔵庫管理', 'レシートスキャン', '賞味期限', 'レシピ提案', '食材管理', 'スマート冷蔵庫', '食品ロス削減', 'AIレシピ'],
  zh: ['冰箱管理', '收据扫描', '保质期', '食谱推荐', '食材管理', '智能冰箱', '减少食物浪费', 'AI食谱'],
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
  const localeKeywords = keywords[locale] || keywords.ko;

  return {
    title: {
      default: title,
      template: `%s | 밀키퍼`,
    },
    description,
    keywords: localeKeywords,
    authors: [{ name: '밀키퍼 팀', url: baseUrl }],
    creator: '밀키퍼',
    publisher: '밀키퍼',
    applicationName: '밀키퍼',
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'ko-KR': '/ko',
        'en-US': '/en',
        'ja-JP': '/ja',
        'zh-CN': '/zh',
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: '밀키퍼 - MealKeeper',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'ja' ? 'ja_JP' : locale === 'en' ? 'en_US' : 'ko_KR',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: '밀키퍼 - 스마트 냉장고 관리',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@mealkeeper',
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      other: {
        'naver-site-verification': process.env.NAVER_SITE_VERIFICATION || '',
      },
    },
    category: 'food & drink',
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="밀키퍼" />
        <meta name="format-detection" content="telephone=no" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <WebApplicationJsonLd locale={locale} />
        <OrganizationJsonLd />
      </head>
      <body className="bg-gray-50 font-sans antialiased dark:bg-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DeepLinkHandler />
          <IngredientSyncProvider />
          <div className="mx-auto min-h-screen max-w-lg bg-white shadow-lg dark:bg-gray-800">
            <main className="pb-20">
              <AuthGuard>{children}</AuthGuard>
            </main>
            <BottomNav locale={locale} />
          </div>
          <ToastContainer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
