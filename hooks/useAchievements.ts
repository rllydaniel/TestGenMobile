import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';

export interface AchievementRecord {
  id: string;
  userId: string;
  achievementKey: string;
  unlockedAt: string;
}

export function useAchievements() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        achievementKey: row.achievement_key,
        unlockedAt: row.unlocked_at,
      })) as AchievementRecord[];
    },
  });
}

export function useUnlockAchievement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (achievementKey: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('achievements')
        .upsert(
          { user_id: user.id, achievement_key: achievementKey },
          { onConflict: 'user_id,achievement_key', ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}
