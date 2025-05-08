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
};

export interface FlashcardData {
  word: string;
  translation: string;
  phonetic: string;
  pos: string;
  example: string;
  notes: string;
}
