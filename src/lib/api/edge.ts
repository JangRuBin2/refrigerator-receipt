import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export interface EdgeFunctionDebugInfo {
  url: string;
  hasSession: boolean;
  tokenPreview: string;
  status: number | null;
  statusText: string;
  responseBody: string;
  errorMessage: string | null;
  timestamp: string;
  durationMs: number;
}

let _lastDebugInfo: EdgeFunctionDebugInfo | null = null;

export function getLastEdgeDebugInfo(): EdgeFunctionDebugInfo | null {
  return _lastDebugInfo;
}

export async function callEdgeFunction(
  functionName: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<unknown> {
  const startTime = Date.now();
  const debug: EdgeFunctionDebugInfo = {
    url: `${SUPABASE_URL}/functions/v1/${functionName}`,
    hasSession: false,
    tokenPreview: '',
    status: null,
    statusText: '',
    responseBody: '',
    errorMessage: null,
    timestamp: new Date().toISOString(),
    durationMs: 0,
  };

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    debug.hasSession = !!session?.access_token;
    debug.tokenPreview = session?.access_token
      ? `${session.access_token.slice(0, 20)}...${session.access_token.slice(-10)}`
      : '(no token)';

    if (!session?.access_token) {
      debug.errorMessage = 'Unauthorized - no session token';
      debug.durationMs = Date.now() - startTime;
      _lastDebugInfo = debug;
      throw new Error('Unauthorized');
    }

    const response = await fetch(
      debug.url,
      {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      }
    );

    debug.status = response.status;
    debug.statusText = response.statusText;

    const text = await response.text();
    debug.responseBody = text.length > 2000 ? text.slice(0, 2000) + '...(truncated)' : text;
    debug.durationMs = Date.now() - startTime;
    _lastDebugInfo = debug;

    if (!response.ok) {
      let errorMessage = `Edge function error: ${response.status}`;
      try {
        const error = JSON.parse(text);
        errorMessage = error.error || errorMessage;
      } catch {
        // Non-JSON error response
      }
      debug.errorMessage = errorMessage;
      _lastDebugInfo = debug;
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(text);
    } catch {
      debug.errorMessage = `서버 응답을 처리할 수 없습니다. (raw: ${text.slice(0, 200)})`;
      _lastDebugInfo = debug;
      throw new Error(debug.errorMessage);
    }
  } catch (err) {
    debug.durationMs = Date.now() - startTime;
    if (!debug.errorMessage) {
      debug.errorMessage = err instanceof Error ? err.message : String(err);
    }
    _lastDebugInfo = debug;
    throw err;
  }
}
