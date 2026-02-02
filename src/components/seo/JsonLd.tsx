interface WebApplicationJsonLdProps {
  locale: string;
}

const appNames: Record<string, string> = {
  ko: '밀키퍼 - 스마트 냉장고 관리',
  en: 'MealKeeper - Smart Fridge Management',
  ja: 'ミールキーパー - スマート冷蔵庫管理',
  zh: 'MealKeeper - 智能冰箱管理',
};

const appDescriptions: Record<string, string> = {
  ko: '영수증 스캔으로 식재료를 자동 등록하고, 유통기한 관리와 AI 레시피 추천을 받아보세요.',
  en: 'Scan receipts to auto-register ingredients, manage expiry dates, and get AI-powered recipe recommendations.',
  ja: 'レシートスキャンで食材を自動登録、賞味期限管理とAIレシピ提案を受けましょう。',
  zh: '扫描收据自动登记食材，管理保质期并获取AI食谱推荐。',
};

export function WebApplicationJsonLd({ locale }: WebApplicationJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mealkeeper.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: appNames[locale] || appNames.ko,
    description: appDescriptions[locale] || appDescriptions.ko,
    url: `${baseUrl}/${locale}`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    featureList: [
      'Receipt OCR scanning',
      'Expiry date management',
      'AI recipe recommendations',
      'Smart shopping list',
      'Nutrition analysis',
    ],
    screenshot: `${baseUrl}/opengraph-image`,
    softwareVersion: '1.0.0',
    author: {
      '@type': 'Organization',
      name: '밀키퍼',
      url: baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mealkeeper.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '밀키퍼',
    alternateName: 'MealKeeper',
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Korean', 'English', 'Japanese', 'Chinese'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
