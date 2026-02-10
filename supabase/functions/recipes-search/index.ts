import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { checkAccess } from '../_shared/free-trial.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium/free trial
    const access = await checkAccess(supabase, user.id, 'external_recipe_search');
    if (!access.hasAccess) {
      return new Response(
        JSON.stringify({
          error: '무료 체험 횟수를 모두 사용했습니다.',
          freeTrial: access.freeTrial,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Support both GET params and POST body
    const url = new URL(req.url);
    let type = url.searchParams.get('type') || 'all';
    let customQuery = url.searchParams.get('q');
    let strategy = url.searchParams.get('strategy') || 'random';
    let ingredientsParam = url.searchParams.get('ingredients');

    // If POST, read body for params
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.query) customQuery = body.query;
        if (body.type) type = body.type;
        if (body.strategy) strategy = body.strategy;
        if (body.ingredients) ingredientsParam = body.ingredients;
      } catch { /* no body */ }
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

    const youtubeConfigured = !!youtubeApiKey;
    const googleConfigured = !!(googleSearchApiKey && googleSearchEngineId);

    if (!youtubeConfigured && !googleConfigured) {
      return new Response(
        JSON.stringify({
          error: 'Search APIs are not configured',
          apiStatus: { youtube: false, google: false },
          results: [],
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query: string;
    if (customQuery) {
      query = customQuery;
    } else if (ingredientsParam) {
      query = ingredientsParam.replace(/,/g, ' ');
    } else {
      // Get user's ingredients
      const { data: userIngredients } = await supabase
        .from('ingredients')
        .select('name, expiry_date')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      const ingredients = userIngredients || [];
      if (ingredients.length === 0) {
        return new Response(
          JSON.stringify({
            error: '냉장고에 재료가 없습니다.',
            apiStatus: { youtube: youtubeConfigured, google: googleConfigured },
            results: [],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let selected: string[];
      if (strategy === 'expiring') {
        const count = Math.min(ingredients.length, Math.floor(Math.random() * 2) + 2);
        // deno-lint-ignore no-explicit-any
        selected = ingredients.slice(0, count).map((i: any) => i.name);
      } else {
        // deno-lint-ignore no-explicit-any
        const names = ingredients.map((i: any) => i.name);
        const shuffled = names.sort(() => Math.random() - 0.5);
        const count = Math.min(shuffled.length, Math.floor(Math.random() * 2) + 2);
        selected = shuffled.slice(0, count);
      }

      ingredientsParam = selected.join(',');
      query = selected.join(' ');
    }

    // deno-lint-ignore no-explicit-any
    const results: any[] = [];
    // deno-lint-ignore no-explicit-any
    const promises: Promise<any[]>[] = [];

    // YouTube search
    if ((type === 'all' || type === 'youtube') && youtubeConfigured) {
      promises.push(searchYouTube(query, youtubeApiKey!));
    }

    // Google search
    if ((type === 'all' || type === 'google') && googleConfigured) {
      promises.push(searchGoogle(query, googleSearchApiKey!, googleSearchEngineId!));
    }

    const allResults = await Promise.all(promises);
    for (const r of allResults) results.push(...r);

    // Shuffle
    results.sort(() => Math.random() - 0.5);

    // Log event
    await supabase.from('event_logs').insert({
      user_id: user.id,
      event_type: 'external_recipe_search',
      metadata: {
        query: customQuery || ingredientsParam,
        strategy,
        results_count: results.length,
      },
    });

    const updatedAccess = await checkAccess(supabase, user.id, 'external_recipe_search');

    return new Response(
      JSON.stringify({
        query: customQuery || ingredientsParam,
        results,
        apiStatus: { youtube: youtubeConfigured, google: googleConfigured },
        strategy,
        freeTrial: updatedAccess.freeTrial,
        isPremium: updatedAccess.isPremium,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function searchYouTube(query: string, apiKey: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${query} 레시피 요리`,
      type: 'video',
      maxResults: '5',
      relevanceLanguage: 'ko',
      videoDuration: 'medium',
      order: 'relevance',
      key: apiKey,
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!response.ok) return [];

    const data = await response.json();

    // deno-lint-ignore no-explicit-any
    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'youtube',
      channelName: item.snippet.channelTitle,
      snippet: item.snippet.description?.slice(0, 150),
      publishedAt: item.snippet.publishedAt,
    }));
  } catch {
    return [];
  }
}

// deno-lint-ignore no-explicit-any
async function searchGoogle(query: string, apiKey: string, engineId: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: engineId,
      q: `${query} 레시피`,
      num: '5',
      lr: 'lang_ko',
      safe: 'active',
    });

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!response.ok) return [];

    const data = await response.json();

    // deno-lint-ignore no-explicit-any
    return (data.items || []).map((item: any, index: number) => ({
      id: `google-${index}-${Date.now()}`,
      title: item.title,
      thumbnail:
        item.pagemap?.cse_thumbnail?.[0]?.src ||
        item.pagemap?.cse_image?.[0]?.src,
      url: item.link,
      source: 'google',
      snippet: item.snippet?.slice(0, 150),
      channelName: item.pagemap?.metatags?.[0]?.['og:site_name'] || extractDomain(item.link),
    }));
  } catch {
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}
