"use client";

import { Session } from "next-auth";
import { useEffect, useState } from "react";

export function StatsClient({ session }: { session: Session }) {
  const [stats, setStats] = useState({
    totalCards: 0,
    cardsReviewed: 0,
    quizzesTaken: 0,
    streak: 0,
    accuracy: 0,
    byFolder: [] as Array<{
      folderId: string;
      name: string;
      count: number;
    }>,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Implementation to fetch user stats
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Stats</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* <StatCard
          title="Total Flashcards"
          value={stats.totalCards}
          icon={ListTodo}
        />
        <StatCard
          title="Current Streak"
          value={`${stats.streak} days`}
          icon={Zap}
        />
        <StatCard
          title="Accuracy Rate"
          value={`${stats.accuracy}%`}
          icon={Target}
        /> */}
      </div>

      {/* More detailed stats & charts */}
    </div>
  );
}
