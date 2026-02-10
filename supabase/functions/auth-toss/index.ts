import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';

const TOSS_API_URL = Deno.env.get('APPS_IN_TOSS_API_URL') || 'https://apps-in-toss-api.toss.im';

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

// Fix PEM: handle base64-encoded PEM, restore newlines, ensure proper headers
function fixPem(raw: string): string {
  let pem = raw.trim();

  // Step 1: detect if entire value is base64-encoded PEM (starts with LS0t = "---")
  if (pem.startsWith('LS0t')) {
    try {
      pem = atob(pem);
    } catch {
      // not valid base64, continue as-is
    }
  }

  // Step 2: restore literal \n to real newlines
  pem = pem.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();

  // Step 3: if it already has proper headers with real newlines, return as-is
  if (pem.startsWith('-----BEGIN') && pem.includes('\n')) {
    return pem;
  }

  // Step 4: detect type from existing headers
  let type = 'CERTIFICATE';
  if (pem.includes('PRIVATE KEY')) {
    type = pem.includes('RSA PRIVATE KEY') ? 'RSA PRIVATE KEY' : 'PRIVATE KEY';
  }

  // Step 5: strip all headers and whitespace to get raw base64
  const base64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s/g, '');

  // Step 6: re-wrap at 64 chars with headers
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----\n`;
}

// mTLS fetch helper
async function tossApiFetch(url: string, options: RequestInit): Promise<Response> {
  const rawCert = Deno.env.get('APPS_IN_TOSS_MTLS_CERT');
  const rawKey = Deno.env.get('APPS_IN_TOSS_MTLS_KEY');

  if (!rawCert || !rawKey) {
    throw new Error('mTLS certificates not configured');
  }

  const cert = fixPem(rawCert);
  const key = fixPem(rawKey);

  // deno-lint-ignore no-explicit-any
  const httpClient = (Deno as any).createHttpClient({
    cert, key,
    certChain: cert, privateKey: key,
  });
  // deno-lint-ignore no-explicit-any
  return await fetch(url, { ...options, client: httpClient } as any);
}

// Step 1: Exchange authorizationCode for Toss access token
async function exchangeCodeForToken(
  authorizationCode: string,
  referrer: string
): Promise<{ accessToken: string; refreshToken: string } | { error: string }> {
  const response = await tossApiFetch(
    `${TOSS_API_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode, referrer }),
    }
  );

  const data = await response.json();

  if (data.resultType === 'SUCCESS' && data.success?.accessToken) {
    return {
      accessToken: data.success.accessToken,
      refreshToken: data.success.refreshToken,
    };
  }

  return { error: data.error?.reason || data.error?.message || 'Token exchange failed' };
}

// Step 2: Get user info from Toss API (persistent userKey)
async function getTossUserInfo(
  accessToken: string
): Promise<{ userKey: string } | { error: string }> {
  const response = await tossApiFetch(
    `${TOSS_API_URL}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();

  // Toss API wraps response: { resultType, success: { userKey } }
  const userKey = data.success?.userKey ?? data.userKey;

  if (userKey !== undefined && userKey !== null) {
    return { userKey: String(userKey) };
  }

  return { error: data.error?.reason || data.error?.message || `Unexpected response: ${JSON.stringify(data).substring(0, 200)}` };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { authorizationCode, referrer, tossUserKey: legacyKey } = body;

    // Support both new OAuth2 flow and legacy tossUserKey flow
    let tossUserKey: string;

    if (authorizationCode && referrer) {
      // New flow: exchange authorizationCode for token, get userKey
      const tokenResult = await exchangeCodeForToken(authorizationCode, referrer);
      if ('error' in tokenResult) {
        return new Response(
          JSON.stringify({ success: false, error: `Token exchange: ${tokenResult.error}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userResult = await getTossUserInfo(tokenResult.accessToken);
      if ('error' in userResult) {
        return new Response(
          JSON.stringify({ success: false, error: `User info: ${userResult.error}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      tossUserKey = userResult.userKey;
    } else if (legacyKey && typeof legacyKey === 'string') {
      // Legacy flow: direct tossUserKey (for backward compatibility)
      tossUserKey = legacyKey;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorizationCode/referrer or tossUserKey' }),
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
        user_metadata: { toss_user_key: tossUserKey, auth_provider: 'toss', name: '토스 사용자' },
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
