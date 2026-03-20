import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { useAuth } from '@/lib/auth';
import { UserProfile } from '@/types/user';

export function useProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
