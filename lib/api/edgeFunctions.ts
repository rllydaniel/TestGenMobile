import { supabase } from '@/lib/supabase';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

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

  console.log(`[EdgeFn] Calling: ${functionName}`);

  try {
    // Ensure we have a fresh session before calling
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[EdgeFn] Session:', session ? 'present' : 'none');

    if (session) {
      const expiresIn = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000);
      console.log(`[EdgeFn] Token expires in ${expiresIn}s`);

      // Proactive refresh if expiring within 60s
      if (expiresIn < 60) {
        console.log('[EdgeFn] Refreshing token...');
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
          console.error('[EdgeFn] Refresh failed:', refreshErr.message);
        } else {
          console.log('[EdgeFn] Token refreshed');
        }
      }
    }

    // Do NOT pass custom headers — let supabase-js handle apikey + Authorization
    // Passing custom headers can REPLACE the SDK's automatic headers, causing empty apikey
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const status = error.context.status;
        console.error(`[EdgeFn] HTTP error ${status} from ${functionName}`);
        const errBody = await error.context.json().catch(() => ({}));
        console.error('[EdgeFn] Error body:', JSON.stringify(errBody));
        throw new Error(
          (errBody as any)?.error ??
          (errBody as any)?.message ??
          `Generation failed (${status})`
        );
      }
      if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
        console.error('[EdgeFn] Network error:', error.message);
        throw new Error('Network error — check your connection and try again.');
      }
      console.error('[EdgeFn] Error:', error.message);
      throw new Error(error.message ?? 'Edge function error');
    }

    if (!data) {
      console.error('[EdgeFn] No data returned from', functionName);
      throw new Error('No data returned from edge function');
    }

    console.log(`[EdgeFn] Success: ${functionName}`);
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
};
