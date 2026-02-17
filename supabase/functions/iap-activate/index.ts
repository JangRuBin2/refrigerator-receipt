import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

const IapActivateSchema = z.object({
  orderId: z.string().min(1),
  sku: z.string().min(1),
  tossUserKey: z.string().nullable().optional(),
});

const APPS_IN_TOSS_API_URL = Deno.env.get('APPS_IN_TOSS_API_URL') || 'https://api.apps-in-toss.toss.im';

async function verifyOrderWithToss(orderId: string, tossUserKey?: string | null): Promise<boolean> {
  const certBase64 = Deno.env.get('APPS_IN_TOSS_MTLS_CERT');
  const keyBase64 = Deno.env.get('APPS_IN_TOSS_MTLS_KEY');

  if (!certBase64 || !keyBase64) {
    // mTLS not configured - reject in production, allow in development
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';
    return isDev;
  }

  try {
    const cert = atob(certBase64);
    const key = atob(keyBase64);

    const response = await fetch(
      `${APPS_IN_TOSS_API_URL}/api-partner/v1/apps-in-toss/order/get-order-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tossUserKey ? { 'x-toss-user-key': tossUserKey } : {}),
        },
        body: JSON.stringify({ orderId }),
        // @ts-ignore - Deno supports client parameter for mTLS
        client: { certChain: cert, privateKey: key },
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === 'PAID' || data.status === 'COMPLETED';
  } catch {
    return false;
  }
}

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
    const parsed = IapActivateSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, sku, tossUserKey } = parsed.data;

    // Verify purchase with Toss IAP API before activating
    const isVerified = await verifyOrderWithToss(orderId, tossUserKey);
    if (!isVerified) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order verification failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Activate subscription using admin client
    const supabaseAdmin = createAdminClient();

    const now = new Date();
    const isYearly = sku.includes('yearly');

    // 기존 구독이 아직 유효하면 만료일부터 연장, 아니면 지금부터 시작
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('expires_at, plan')
      .eq('user_id', user.id)
      .single();

    let baseDate = now;
    if (existing?.plan === 'premium' && existing?.expires_at) {
      const existingExpiry = new Date(existing.expires_at);
      if (existingExpiry > now) {
        baseDate = existingExpiry;
      }
    }

    const expiresAt = new Date(baseDate);
    if (isYearly) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'premium',
        billing_cycle: isYearly ? 'yearly' : 'monthly',
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        toss_order_id: orderId,
        ...(tossUserKey ? { toss_user_key: tossUserKey } : {}),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to activate subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId,
          sku,
          activatedAt: now.toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
