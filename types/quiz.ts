export interface FlashcardDetails {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  source_lang: string;
  target_lang: string;
}

export interface QuizAnswer {
  id: string;
  flashcard_id: string;
  is_correct: boolean;
  answered_at: string;
  flashcard: FlashcardDetails;
}

export interface QuizSessionDetails {
  id: string;
  folder_id: string | null;
  folder_name?: string;
  include_reverse: boolean;
  card_count: number;
  created_at: string;
  answers: QuizAnswer[];
}
