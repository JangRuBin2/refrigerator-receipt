const ALLOWED_ORIGINS = [
  'https://refrigerator-receipt.vercel.app',
  'https://mealkeeper.app',
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';

  if (isDev && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
    return origin;
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  // Toss WebView may send requests without Origin header
  if (!origin) {
    return ALLOWED_ORIGINS[0];
  }

  return ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  };
}

// Backward-compatible static headers (for imports that use corsHeaders directly)
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}
