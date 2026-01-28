import type { ExternalRecipe } from '@/types';

const GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

export async function searchGoogleRecipes(
  query: string,
  maxResults: number = 5
): Promise<ExternalRecipe[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    throw new Error('GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID is not configured');
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: `${query} 레시피`,
    num: String(Math.min(maxResults, 10)),
    lr: 'lang_ko',
  });

  const response = await fetch(`${GOOGLE_SEARCH_URL}?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Search API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  return (data.items || []).map((item: {
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
      cse_thumbnail?: Array<{ src: string }>;
      cse_image?: Array<{ src: string }>;
    };
  }, index: number) => ({
    id: `google-${index}-${Date.now()}`,
    title: item.title,
    thumbnail:
      item.pagemap?.cse_thumbnail?.[0]?.src ||
      item.pagemap?.cse_image?.[0]?.src,
    url: item.link,
    source: 'google' as const,
    snippet: item.snippet,
  }));
}
