import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';

function validateBasicAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  const expectedToken = Deno.env.get('TOSS_DISCONNECT_AUTH');
  if (!expectedToken) return false;

  const receivedToken = authHeader.slice('Basic '.length).trim();

  // Direct comparison
  if (receivedToken === expectedToken) return true;

  // Decode received token and compare
  try {
    const decoded = atob(receivedToken);
    if (decoded === expectedToken) return true;
  } catch {
    // Ignore decode error
  }

  // Encode expected and compare
  const encodedExpected = btoa(expectedToken);
  if (receivedToken === encodedExpected) return true;

  return false;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (!validateBasicAuth(req)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const userKey = url.searchParams.get('userKey');
    const referrer = url.searchParams.get('referrer');

    if (userKey === null || referrer !== 'UNLINK') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test request
    if (Number(userKey) === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Test request acknowledged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();
    const tossUserKey = String(userKey);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('toss_user_key', tossUserKey)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ success: true, message: 'User not found or already deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancel subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({ plan: 'free', auto_renew: false, updated_at: new Date().toISOString() })
      .eq('user_id', profile.id);

    // Delete user (CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);

    if (deleteError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
