export interface StatsData {
  // Quiz stats
  total_quizzes: number;
  total_answers: number;
  correct_answers: number;
  accuracy_percent: number;

  // Review stats
  total_reviews: number;
  cards_reviewed: number;
  avg_cards_per_session: number;
  retention_rate: number;
  review_retention_over_time: {
    date: string;
    rate: number;
  }[];
  interval_distribution: {
    interval: string;
    count: number;
  }[];

  // General stats
  streak_days: number;
  recent_activity: string[];

  pos_distribution: {
    pos: string;
    count: number;
  }[];
}
