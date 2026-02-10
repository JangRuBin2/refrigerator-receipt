import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export async function callEdgeFunction<T>(
  functionName: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Edge function error: ${response.status}`);
  }

  return response.json();
}
