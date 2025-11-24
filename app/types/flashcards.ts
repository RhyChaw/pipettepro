// Data models for flashcards generated from notes

export interface Flashcard {
  id: string;
  front: string; // Question or term
  back: string; // Answer or definition
  noteId?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface FlashcardSet {
  id: string;
  noteId?: string; // Optional - links to source note if available
  userId: string;
  title: string;
  flashcards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

