import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

const APPS_IN_TOSS_API_URL = Deno.env.get('APPS_IN_TOSS_API_URL') || 'https://api.apps-in-toss.toss.im';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { orderId, tossUserKey } = body as {
      orderId: string;
      tossUserKey: string;
    };

    if (!orderId || !tossUserKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Toss API with mTLS
    const status = await getOrderStatus(orderId, tossUserKey);

    if (!status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get order status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOrderStatus(
  orderId: string,
  tossUserKey: string
): Promise<Record<string, unknown> | null> {
  const certBase64 = Deno.env.get('APPS_IN_TOSS_MTLS_CERT');
  const keyBase64 = Deno.env.get('APPS_IN_TOSS_MTLS_KEY');

  if (!certBase64 || !keyBase64) {
    // Fallback: check local subscription data
    return { orderId, status: 'unknown', message: 'mTLS not configured' };
  }

  try {
    const cert = atob(certBase64);
    const key = atob(keyBase64);

    // Deno supports TLS client certificates via Deno.connectTls
    // For Supabase Edge Functions, we use fetch with client cert
    const response = await fetch(
      `${APPS_IN_TOSS_API_URL}/api-partner/v1/apps-in-toss/order/get-order-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toss-user-key': tossUserKey,
        },
        body: JSON.stringify({ orderId }),
        // @ts-ignore - Deno supports client parameter for mTLS
        client: {
          certChain: cert,
          privateKey: key,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
