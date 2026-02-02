import { MetadataRoute } from 'next';

const locales = ['ko', 'en', 'ja', 'zh'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mealkeeper.app';

  const pages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/fridge', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/recipes', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/recommend', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/scan', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/shopping', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/nutrition', priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${page.path}`])
          ),
        },
      });
    }
  }

  return entries;
}
