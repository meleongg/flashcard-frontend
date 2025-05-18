export enum ReviewStatus {
  LOADING,
  READY,
  IN_PROGRESS,
  FLIPPED,
  COMPLETE,
  ERROR,
  EMPTY,
}

export enum ReviewRating {
  FAILED = 0, // Complete failure to recall
  BAD = 1, // Incorrect response but recognized answer
  DIFFICULT = 2, // Correct response with significant difficulty
  GOOD = 3, // Correct response with some effort
  EASY = 4, // Correct response with little effort
  PERFECT = 5, // Perfect recall
}

export interface ReviewStats {
  cardsReviewed: number;
  correct: number;
  wrong: number;
  remaining: number;
}

export interface ReviewSessionSummary {
  session_id: string;
  user_id: string;
  total_cards: number;
  average_rating: number;
  ratings_breakdown: Record<string, number>;
  reviewed_at: string;
}
