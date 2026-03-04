const ALLOWED_ORIGINS = [
  'https://refrigerator-receipt.vercel.app',
  'https://mealkeeper.app',
  'https://acorn.apps.tossmini.com',
  'https://acorn.private-apps.tossmini.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';

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
