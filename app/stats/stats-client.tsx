"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiUrl } from "@/lib/constants";
import { formatDate, formatPOS } from "@/lib/utils";
import { StatsData } from "@/types/stats";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  LineChart as ChartIcon,
  CheckSquare,
  Loader,
  Package,
  Paintbrush,
  Repeat,
  Target,
  Zap,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// Replace the insights rendering in the vocabulary tab with this component
function POSInsightDisplay({
  insight,
  status,
}: {
  insight: string | null;
  status: string;
}) {
  if (!insight) {
    return (
      <p className="text-sm text-muted-foreground">
        No data available yet. Add flashcards to see insights.
      </p>
    );
  }

  // Map status to appropriate UI treatment
  const getStatusUI = () => {
    switch (status) {
      case "noun_heavy":
        return (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Noun-heavy vocabulary detected</strong>
            </p>
            <p className="text-sm text-muted-foreground">{insight}</p>
            <div className="bg-primary/10 p-2 rounded text-xs border-l-2 border-primary mt-2">
              <strong>Tip:</strong> Add flashcards for common actions like "to
              walk," "to eat," "to think"
            </div>
          </div>
        );

      case "needs_descriptive":
        return (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>More descriptive words needed</strong>
            </p>
            <p className="text-sm text-muted-foreground">{insight}</p>
            <div className="bg-primary/10 p-2 rounded text-xs border-l-2 border-primary mt-2">
              <strong>Tip:</strong> Focus on adding adjectives like "beautiful,"
              "difficult," "interesting"
            </div>
          </div>
        );

      case "verb_heavy":
        return (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Verb-heavy vocabulary</strong>
            </p>
            <p className="text-sm text-muted-foreground">{insight}</p>
            <div className="bg-primary/10 p-2 rounded text-xs border-l-2 border-primary mt-2">
              <strong>Tip:</strong> Try adding more nouns related to your
              interests and daily life
            </div>
          </div>
        );

      case "balanced":
        return (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Well-balanced vocabulary!</strong>
            </p>
            <p className="text-sm text-muted-foreground">{insight}</p>
            <div className="bg-primary/10 p-2 rounded text-xs border-l-2 border-primary mt-2">
              <strong>Great job!</strong> Continue building your vocabulary
              across all categories
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
        );
    }
  };

  return getStatusUI();
}

export function StatsClient({ session }: { session: Session }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [posInsights, setPosInsights] = useState<{
    insight: string | null;
    tags: Record<string, number>;
    status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      // Fetch regular stats
      const statsRes = await fetch(`${apiUrl}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsRes.ok) {
        throw new Error(`Failed to fetch stats: ${statsRes.status}`);
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch POS insights
      const insightsRes = await fetch(`${apiUrl}/stats/pos-insights`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setPosInsights(insightsData);
      }
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

  // Prepare retention data for the chart
  const prepareRetentionData = () => {
    if (!stats?.review_retention_over_time) return [];

    return stats.review_retention_over_time.map((item) => ({
      date: formatDate(item.date),
      // Ensure the rate is a valid number
      rate: isNaN(item.rate) ? 0 : Math.round(item.rate),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Replace the existing totalCards calculation with this direct reference
  const totalCards = stats?.total_cards || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <h1 className="text-2xl font-bold">Your Learning Statistics</h1>

      {stats ? (
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Combined Stats */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Current Streak"
                value={`${stats.streak_days || 0} days`}
                icon={Zap}
                description="Consecutive days of practice"
              />
              <StatCard
                title="Total Sessions"
                value={(stats.total_quizzes || 0) + (stats.total_reviews || 0)}
                icon={Calendar}
                description="Quizzes and reviews combined"
              />
              <StatCard
                title="Words Practiced"
                value={(stats.total_answers || 0) + (stats.cards_reviewed || 0)}
                icon={Brain}
                description="All words studied"
              />
              <StatCard
                title="Overall Accuracy"
                value={`${Math.round(
                  ((stats.accuracy_percent || 0) +
                    (stats.retention_rate || 0)) /
                    2
                )}%`}
                icon={Target}
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
                    <Bar
                      dataKey="activity"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    >
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium">Quiz Accuracy</h3>
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

                  <div>
                    <h3 className="text-md font-medium">Review Retention</h3>
                    <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            isNaN(stats.retention_rate)
                              ? 0
                              : stats.retention_rate
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">
                        Retention rate
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(stats.retention_rate || 0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-muted-foreground">
                    You've completed{" "}
                    <strong>{stats.total_quizzes} quizzes</strong> and{" "}
                    <strong>{stats.total_reviews} review sessions</strong>,
                    practicing a total of{" "}
                    <strong>
                      {stats.total_answers + stats.cards_reviewed} words
                    </strong>
                    .
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

            {/* Move the POS distribution card from Overview to a new Vocabulary tab section */}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Quizzes"
                value={stats.total_quizzes}
                icon={CheckSquare}
              />
              <StatCard
                title="Words Answered"
                value={stats.total_answers}
                icon={Brain}
              />
              <StatCard
                title="Correct Answers"
                value={stats.correct_answers}
                icon={Award}
              />
              <StatCard
                title="Accuracy Rate"
                value={`${Math.round(stats.accuracy_percent)}%`}
                icon={Target}
                description={`${stats.correct_answers} of ${stats.total_answers} correct`}
              />
            </div>

            {/* Quiz performance details could go here */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quiz Performance</h2>
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
                    <strong>{stats.total_quizzes} quizzes</strong> and answered{" "}
                    <strong>{stats.total_answers} questions</strong>. Keep
                    practicing to improve your accuracy!
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Review Sessions"
                value={stats.total_reviews}
                icon={Repeat}
              />
              <StatCard
                title="Cards Reviewed"
                value={stats.cards_reviewed}
                icon={Brain}
              />
              <StatCard
                title="Avg. Cards/Session"
                value={Math.round(stats.avg_cards_per_session || 0)}
                icon={ChartIcon}
              />
              <StatCard
                title="Retention Rate"
                value={`${Math.round(stats.retention_rate || 0)}%`}
                icon={Target}
                description="Cards remembered correctly"
              />
            </div>

            {/* Retention Over Time Chart */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">
                Retention Over Time
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareRetentionData()}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Retention Rate"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Your memory retention rate over the past week
              </p>
            </Card>

            {/* Interval Distribution Chart */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Card Intervals</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      stats.interval_distribution?.map((item) => ({
                        interval: item.interval,
                        count: isNaN(item.count) ? 0 : item.count,
                      })) || []
                    }
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="interval" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [value, "Cards"]}
                      labelFormatter={(label) => `Interval: ${label}`}
                    />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Distribution of your flashcards by review interval
              </p>
              <div className="pt-4 mt-4 border-t">
                <p className="text-muted-foreground">
                  Longer intervals mean better long-term memory retention.
                  Regular reviews help move cards to longer intervals.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Vocabulary Tab */}
          <TabsContent value="vocabulary" className="space-y-6">
            {/* Vocabulary Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Words"
                value={totalCards}
                icon={BookOpen}
                description="Unique words learned"
              />
              <StatCard
                title="Nouns"
                value={
                  posInsights?.tags?.["NOUN"]
                    ? Math.round((posInsights.tags["NOUN"] / 100) * totalCards)
                    : 0
                }
                icon={Package}
                description="People, places, things"
              />
              <StatCard
                title="Verbs"
                value={
                  posInsights?.tags?.["VERB"]
                    ? Math.round((posInsights.tags["VERB"] / 100) * totalCards)
                    : 0
                }
                icon={Activity}
                description="Action words"
              />
              <StatCard
                title="Adjectives"
                value={
                  posInsights?.tags?.["ADJ"]
                    ? Math.round((posInsights.tags["ADJ"] / 100) * totalCards)
                    : 0
                }
                icon={Paintbrush}
                description="Descriptive words"
              />
            </div>

            {/* POS Distribution Chart */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Parts of Speech Distribution
                </h2>
                {posInsights?.status && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      posInsights.status === "balanced"
                        ? "bg-green-100 text-green-800"
                        : posInsights.status === "no_data"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {posInsights.status === "balanced"
                      ? "Balanced"
                      : posInsights.status === "noun_heavy"
                      ? "Noun Heavy"
                      : posInsights.status === "verb_heavy"
                      ? "Verb Heavy"
                      : posInsights.status === "needs_descriptive"
                      ? "Need Descriptives"
                      : "No Data"}
                  </span>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Left column: Distribution chart */}
                <div>
                  <h3 className="text-md font-medium mb-3">
                    Distribution Breakdown
                  </h3>
                  <div className="space-y-3">
                    {posInsights?.tags &&
                      Object.entries(posInsights.tags).map(
                        ([pos, percentage]) => {
                          // Calculate count based on percentage and totalCards
                          const count = Math.round(
                            (percentage / 100) * totalCards
                          );

                          return (
                            <div key={pos} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                  {formatPOS(pos)}
                                </span>
                                <span className="text-muted-foreground">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}

                    {/* Show message if no data */}
                    {(!posInsights?.tags ||
                      Object.keys(posInsights.tags).length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No distribution data available
                      </p>
                    )}
                  </div>
                </div>

                {/* Right column: Insights */}
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="text-md font-medium mb-2">
                    Learning Insights
                  </h3>
                  {posInsights ? (
                    <POSInsightDisplay
                      insight={posInsights.insight}
                      status={posInsights.status}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Loading insights...
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Vocabulary Balance Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Why Vocabulary Balance Matters
              </h2>

              <div className="space-y-4">
                <p>
                  Many language learners tend to focus heavily on nouns while
                  neglecting other parts of speech. However, a balanced
                  vocabulary across different grammatical categories is crucial
                  for fluency.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/20 p-3 rounded-lg">
                    <h3 className="font-medium mb-1">
                      Balanced Learning Benefits
                    </h3>
                    <ul className="text-sm space-y-1 list-disc pl-4">
                      <li>Better sentence construction ability</li>
                      <li>More natural expression in conversations</li>
                      <li>Improved comprehension of native speakers</li>
                      <li>Faster progress to fluency</li>
                    </ul>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-lg">
                    <h3 className="font-medium mb-1">
                      Recommended Distribution
                    </h3>
                    <ul className="text-sm space-y-1 list-disc pl-4">
                      <li>Nouns: 30-40% of vocabulary</li>
                      <li>Verbs: 20-30% of vocabulary</li>
                      <li>Adjectives: 15-20% of vocabulary</li>
                      <li>Adverbs, prepositions, etc.: 20-25%</li>
                    </ul>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                  <p>
                    Use these insights to guide your flashcard creation and
                    ensure you're building a well-rounded vocabulary that helps
                    you communicate effectively.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            No stats available yet. Start taking quizzes or reviewing flashcards
            to see your progress!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button variant="outline" asChild>
              <a href="/flashcards">Create Flashcards</a>
            </Button>
            <Button asChild>
              <a href="/flashcards/review">Start Review Session</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// StatCard component - updated to handle NaN values
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
  // Format value to handle NaN, null, and undefined
  const displayValue = () => {
    if (value === null || value === undefined) return "0";
    if (typeof value === "number" && isNaN(value)) return "0";
    return value;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{displayValue()}</p>
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
