import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';

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

    const supabaseAdmin = createAdminClient();
    const userId = user.id;

    // Explicitly delete user data from all tables before deleting auth user
    // This ensures cleanup even if CASCADE constraints are misconfigured
    const tables = [
      'subscriptions',
      'shopping_lists',
      'user_favorites',
      'event_logs',
      'ingredients',
    ];

    for (const table of tables) {
      await supabaseAdmin.from(table).delete().eq('user_id', userId);
    }

    // Delete profile (which is the FK root for most tables)
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError.message);
      return new Response(
        JSON.stringify({ error: `계정 삭제 실패: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('auth-delete-account error:', err);
    return new Response(
      JSON.stringify({ error: `서버 오류: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
