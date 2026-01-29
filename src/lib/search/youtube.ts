import type { ExternalRecipe } from '@/types';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// 캐시 (메모리 기반, 15분 TTL)
const cache = new Map<string, { data: ExternalRecipe[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15분

export function isYouTubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

export async function searchYouTubeRecipes(
  query: string,
  maxResults: number = 5
): Promise<ExternalRecipe[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY is not configured');
    return [];
  }

  // 캐시 확인
  const cacheKey = `youtube:${query}:${maxResults}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${query} 레시피 요리`,
      type: 'video',
      maxResults: String(maxResults),
      relevanceLanguage: 'ko',
      videoDuration: 'medium', // 중간 길이 영상 우선 (4-20분)
      order: 'relevance',
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_URL}?${params}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('YouTube API error:', response.status, error);
      return [];
    }

    const data = await response.json();

    const results: ExternalRecipe[] = (data.items || []).map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        description: string;
        publishedAt: string;
        thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
      };
    }) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'youtube' as const,
      channelName: item.snippet.channelTitle,
      snippet: item.snippet.description?.slice(0, 150),
      publishedAt: item.snippet.publishedAt,
    }));

    // 캐시 저장
    cache.set(cacheKey, { data: results, timestamp: Date.now() });

    return results;
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

// 캐시 클리어 (필요시)
export function clearYouTubeCache(): void {
  cache.clear();
}
