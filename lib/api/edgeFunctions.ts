import { supabase } from '@/lib/supabase';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

interface CallFunctionParams {
  functionName: string;
  body: Record<string, any>;
  timeoutMs?: number;
}

export const callEdgeFunction = async <T>({
  functionName,
  body,
  timeoutMs = 30000,
}: CallFunctionParams): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  console.log(`[EdgeFn] ── Calling: ${functionName} ──`);

  try {
    // ── Step 1: get current session ──────────────────────────────────────────
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    if (!currentSession) {
      console.error('[Auth] ERROR: No session found — user may not be logged in');
    } else {
      console.log('[Auth] Session:', currentSession ? 'present' : 'null');
      console.log('[Auth] Access token:', currentSession.access_token?.slice(0, 20) + '...');
      console.log('[Auth] Token expires at:', currentSession.expires_at,
        '(now:', Math.floor(Date.now() / 1000), ', diff:',
        (currentSession.expires_at ?? 0) - Math.floor(Date.now() / 1000), 's)');
    }

    // ── Step 2: proactive refresh if expiring within 60 s ────────────────────
    let session = currentSession;
    if (session?.expires_at) {
      const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
      if (expiresIn < 60) {
        console.log(`[Auth] Token expires in ${expiresIn}s — refreshing proactively...`);
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
          console.error('[Auth] Refresh failed:', refreshErr.message);
        } else if (refreshed.session) {
          session = refreshed.session;
          console.log('[Auth] Refreshed session successfully. New token prefix:',
            session.access_token?.slice(0, 20) + '...');
        }
      }
    }

    // ── Step 3: force server-side validation (updates stored session if needed) ─
    const { error: getUserErr } = await supabase.auth.getUser();
    if (getUserErr) {
      console.error('[Auth] getUser() error:', getUserErr.message);
    }
    // Re-fetch after getUser() may have refreshed the token
    const { data: { session: latestSession } } = await supabase.auth.getSession();
    if (latestSession) session = latestSession;

    // ── Step 4: build headers ─────────────────────────────────────────────────
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      console.error('[Auth] ERROR: No access_token — Authorization header will be missing!');
    }

    console.log('[EdgeFn] Sending headers:', {
      apikey: SUPABASE_ANON_KEY?.slice(0, 10) + '...',
      Authorization: session?.access_token
        ? `Bearer ${session.access_token.slice(0, 20)}...`
        : 'MISSING',
    });

    // ── Step 5: invoke ────────────────────────────────────────────────────────
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers,
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        console.error(`[EdgeFn] Error status: ${error.context.status}`);
        const errBody = await error.context.json().catch(() => ({}));
        console.error('[EdgeFn] Error body:', JSON.stringify(errBody));
        throw new Error(
          (errBody as any)?.error ??
          (errBody as any)?.message ??
          `Generation failed (${error.context.status})`
        );
      }
      if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
        console.error('[EdgeFn] Network/relay error:', error.message);
        throw new Error('Network error — check your connection and try again.');
      }
      console.error('[EdgeFn] Unknown error:', error.message);
      throw new Error(error.message ?? 'Edge function error');
    }

    if (!data) {
      console.error('[EdgeFn] No data returned from', functionName);
      throw new Error('No data returned from edge function');
    }

    console.log(`[EdgeFn] Success: ${functionName} — keys:`, Object.keys(data));
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
};
