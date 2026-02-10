import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';

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
    const { orderId, sku, tossUserKey } = body as {
      orderId: string;
      sku: string;
      tossUserKey: string;
    };

    if (!orderId || !sku || !tossUserKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Activate subscription using admin client
    const supabaseAdmin = createAdminClient();

    const now = new Date();
    const isYearly = sku.includes('yearly');
    const expiresAt = new Date(now);

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
        toss_user_key: tossUserKey,
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
