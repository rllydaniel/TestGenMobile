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

  try {
    // Force a server-side token validation + refresh so we always send a fresh JWT.
    // getUser() makes a network round-trip and updates the stored session if needed.
    await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const errBody = await error.context.json().catch(() => ({}));
        throw new Error(
          (errBody as any)?.error ??
          (errBody as any)?.message ??
          `Generation failed (${error.context.status})`
        );
      }
      if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
        throw new Error('Network error — check your connection and try again.');
      }
      throw new Error(error.message ?? 'Edge function error');
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
};
