export type PaginatedFlashcardResponse = {
  total: number;
  flashcards: FlashcardResponse[];
};

export type FlashcardResponse = {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  pos: string;
  example: string;
  notes: string;
  user_id: string;
  created_at: string;
  folder_id?: string;
  source_lang?: string;
  target_lang?: string;
};

export interface FlashcardData {
  id?: string;
  word: string;
  translation: string;
  phonetic: string;
  pos: string;
  example: string;
  notes: string;
  source_lang?: string;
  target_lang?: string;
}
