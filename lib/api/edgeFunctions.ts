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

  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

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
