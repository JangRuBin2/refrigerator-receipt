import type { ExternalRecipe } from '@/types';

const GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

// 캐시 (메모리 기반, 15분 TTL)
const cache = new Map<string, { data: ExternalRecipe[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15분

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID);
}

export async function searchGoogleRecipes(
  query: string,
  maxResults: number = 5
): Promise<ExternalRecipe[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    console.warn('GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID is not configured');
    return [];
  }

  // 캐시 확인
  const cacheKey = `google:${query}:${maxResults}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: engineId,
      q: `${query} 레시피`,
      num: String(Math.min(maxResults, 10)),
      lr: 'lang_ko',
      safe: 'active',
    });

    const response = await fetch(`${GOOGLE_SEARCH_URL}?${params}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Search API error:', response.status, error);
      return [];
    }

    const data = await response.json();

    const results: ExternalRecipe[] = (data.items || []).map((item: {
      title: string;
      link: string;
      snippet: string;
      pagemap?: {
        cse_thumbnail?: Array<{ src: string }>;
        cse_image?: Array<{ src: string }>;
        metatags?: Array<{ 'og:site_name'?: string }>;
      };
    }, index: number) => ({
      id: `google-${index}-${Date.now()}`,
      title: item.title,
      thumbnail:
        item.pagemap?.cse_thumbnail?.[0]?.src ||
        item.pagemap?.cse_image?.[0]?.src,
      url: item.link,
      source: 'google' as const,
      snippet: item.snippet?.slice(0, 150),
      channelName: item.pagemap?.metatags?.[0]?.['og:site_name'] || extractDomain(item.link),
    }));

    // 캐시 저장
    cache.set(cacheKey, { data: results, timestamp: Date.now() });

    return results;
  } catch (error) {
    console.error('Google search error:', error);
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// 캐시 클리어 (필요시)
export function clearGoogleCache(): void {
  cache.clear();
}
