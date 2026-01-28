import type { ExternalRecipe } from '@/types';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export async function searchYouTubeRecipes(
  query: string,
  maxResults: number = 5
): Promise<ExternalRecipe[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${query} 레시피 요리`,
    type: 'video',
    maxResults: String(maxResults),
    relevanceLanguage: 'ko',
    key: apiKey,
  });

  const response = await fetch(`${YOUTUBE_API_URL}?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  return (data.items || []).map((item: {
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      description: string;
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
    snippet: item.snippet.description,
  }));
}
