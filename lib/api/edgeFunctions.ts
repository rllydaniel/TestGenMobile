import { supabase } from '@/lib/supabase';

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
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
};
