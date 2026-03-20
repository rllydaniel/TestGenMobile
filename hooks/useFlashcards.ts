import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { generateFlashcards } from '@/services/api';
import { FlashcardDeck } from '@/types/flashcard';

export function useFlashcardDecks() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FlashcardDeck[];
    },
  });
}

export function useFlashcardDeck(deckId: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['flashcards', deckId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*, flashcards(*)')
        .eq('id', deckId)
        .single();
      if (error) throw error;
      return data as FlashcardDeck;
    },
    enabled: !!deckId,
  });
}

export function useGenerateFlashcards() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subject,
      topics,
      count,
    }: {
      subject: string;
      topics: string[];
      count: number;
    }) => generateFlashcards(supabase, subject, topics, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}
