"use client";

import { Card, CardContent } from "@/components/ui/card";
import { apiUrl } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ListTodo, Loader, Target, Zap } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// Define the types for our stats response
interface StatsData {
  total_quizzes: number;
  total_answers: number;
  correct_answers: number;
  accuracy_percent: number;
  streak_days: number;
  recent_activity: string[];
}

export function StatsClient({ session }: { session: Session }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const res = await fetch(`${apiUrl}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.status}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare activity data for the chart
  const prepareActivityData = () => {
    if (!stats?.recent_activity) return [];

    return stats.recent_activity.map((date) => ({
      date: formatDate(date),
      activity: 1, // Just showing presence of activity
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <h1 className="text-2xl font-bold">Your Learning Statistics</h1>

      {stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Quizzes"
              value={stats.total_quizzes}
              icon={ListTodo}
            />
            <StatCard
              title="Words Reviewed"
              value={stats.total_answers}
              icon={ListTodo}
            />
            <StatCard
              title="Current Streak"
              value={`${stats.streak_days} days`}
              icon={Zap}
              description="Consecutive days of practice"
            />
            <StatCard
              title="Accuracy Rate"
              value={`${Math.round(stats.accuracy_percent)}%`}
              icon={Target}
              description={`${stats.correct_answers} of ${stats.total_answers} correct`}
            />
          </div>

          {/* Activity Chart */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareActivityData()}>
                  <XAxis dataKey="date" />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => ["Active", ""]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="activity" fill="#22c55e" radius={[4, 4, 0, 0]}>
                    {prepareActivityData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#22c55e" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Days with learning activity in the past week
            </p>
          </Card>

          {/* Performance Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Learning Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium">Accuracy Breakdown</h3>
                <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${stats.accuracy_percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">
                    {stats.correct_answers} correct
                  </span>
                  <span className="text-muted-foreground">
                    {stats.total_answers - stats.correct_answers} incorrect
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-muted-foreground">
                  You've completed a total of{" "}
                  <strong>{stats.total_quizzes} quizzes</strong> and reviewed{" "}
                  <strong>{stats.total_answers} words</strong>.
                  {stats.streak_days > 0 && (
                    <>
                      {" "}
                      Your current learning streak is{" "}
                      <strong>
                        {stats.streak_days}{" "}
                        {stats.streak_days === 1 ? "day" : "days"}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            No stats available yet. Start taking quizzes to see your progress!
          </p>
        </div>
      )}
    </div>
  );
}

// StatCard component
function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
