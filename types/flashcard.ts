export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number; // 0-1
  lastReviewed?: string;
  nextReview?: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  subject: string;
  cardCount: number;
  masteredCount: number;
  cards: Flashcard[];
  createdAt: string;
}
