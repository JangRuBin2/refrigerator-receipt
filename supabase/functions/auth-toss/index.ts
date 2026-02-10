import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';

function generateTossEmail(tossUserKey: string): string {
  return `toss_${tossUserKey}@mealkeeper.internal`;
}

async function generateTossPassword(tossUserKey: string): Promise<string> {
  const secret = Deno.env.get('TOSS_AUTH_SECRET') || 'default-toss-secret';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(tossUserKey));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { tossUserKey } = await req.json();

    if (!tossUserKey || typeof tossUserKey !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid tossUserKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();
    const email = generateTossEmail(tossUserKey);
    const password = await generateTossPassword(tossUserKey);

    // Try sign in
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      return new Response(
        JSON.stringify({
          success: true,
          session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_in: signInData.session.expires_in,
          },
          user: { id: signInData.user?.id, email: signInData.user?.email },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user if not found
    if (signInError?.message?.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { toss_user_key: tossUserKey, auth_provider: 'toss' },
      });

      if (signUpError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sign in the new user
      const { data: newSignInData, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (newSignInError || !newSignInData?.session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to sign in new user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create profile
      await supabaseAdmin.from('profiles').upsert({
        id: signUpData.user.id,
        email,
        name: 'Toss User',
        toss_user_key: tossUserKey,
        updated_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          session: {
            access_token: newSignInData.session.access_token,
            refresh_token: newSignInData.session.refresh_token,
            expires_in: newSignInData.session.expires_in,
          },
          user: { id: newSignInData.user?.id, email: newSignInData.user?.email },
          isNewUser: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: signInError?.message || 'Authentication failed' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
