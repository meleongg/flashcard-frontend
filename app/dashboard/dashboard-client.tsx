"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/constants";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { FlashcardReviewPreview } from "@/types/flashcard";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Clock,
  Lightbulb,
  Loader,
  Plus,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DueFlashcardsStats {
  dueCount: number;
  nextReviewDate: Date | null;
  upcomingReviews: FlashcardReviewPreview[];
}

export function DashboardClient({ session }: { session: Session }) {
  // State for review stats
  const [reviewStats, setReviewStats] = useState<DueFlashcardsStats>({
    dueCount: 0,
    nextReviewDate: null,
    upcomingReviews: [],
  });
  const [reviewStatsLoading, setReviewStatsLoading] = useState(true);
  const [quickAddText, setQuickAddText] = useState("");

  // Fetch review stats on load
  useEffect(() => {
    fetchReviewStats();
  }, [session]);

  const fetchReviewStats = async () => {
    setReviewStatsLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      // Get due flashcards
      const dueRes = await fetch(`${apiUrl}/flashcards/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Get upcoming reviews preview
      const previewRes = await fetch(
        `${apiUrl}/flashcards/review/preview?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!dueRes.ok || !previewRes.ok) {
        throw new Error("Failed to fetch review data");
      }

      const dueFlashcards = await dueRes.json();
      const upcomingReviews = await previewRes.json();

      setReviewStats({
        dueCount: dueFlashcards.length,
        nextReviewDate:
          upcomingReviews.length > 0
            ? new Date(upcomingReviews[0].next_review_date)
            : null,
        upcomingReviews: upcomingReviews,
      });
    } catch (err) {
      console.error("Error fetching review stats:", err);
      toast.error("Failed to load review statistics");
    } finally {
      setReviewStatsLoading(false);
    }
  };

  // Handle quick add text - redirects to flashcard create page with prefilled text
  const handleQuickAddEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && quickAddText.trim()) {
      window.location.href = `/flashcards?create=true&text=${encodeURIComponent(
        quickAddText.trim()
      )}`;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Review Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cards Due Today */}
        <Card
          className={cn(
            "col-span-1",
            reviewStats.dueCount > 0 ? "border-primary/50 bg-primary/5" : ""
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Cards Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewStatsLoading ? (
              <div className="flex justify-center py-2">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-3xl font-bold">{reviewStats.dueCount}</div>
            )}
          </CardContent>
          <CardFooter>
            {reviewStats.dueCount > 0 ? (
              <Button asChild className="w-full" size="sm">
                <Link href="/flashcards/review">
                  Review Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full text-muted-foreground"
              >
                All Caught Up
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Next Review */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Next Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewStatsLoading ? (
              <div className="flex justify-center py-2">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviewStats.nextReviewDate ? (
              <div>
                <div className="text-xl font-medium">
                  {reviewStats.nextReviewDate < new Date()
                    ? "Now"
                    : formatDistanceToNow(reviewStats.nextReviewDate)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {reviewStats.nextReviewDate.toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No upcoming reviews</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Add */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Quick Add
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Input
              placeholder="New word..."
              className="text-sm h-8"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={handleQuickAddEnter}
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/flashcards?create=true">
                Create New Card
                <Plus className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Upcoming Reviews Preview */}
      {reviewStats.upcomingReviews.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming Reviews</CardTitle>
            <CardDescription>
              Your next scheduled flashcards for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewStatsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                reviewStats.upcomingReviews.map((card) => (
                  <div
                    key={card.id}
                    className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{card.word}</div>
                      <div className="text-sm text-muted-foreground">
                        {card.translation}
                      </div>
                    </div>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {new Date(card.next_review_date) < new Date()
                        ? "Due now"
                        : formatDistanceToNow(new Date(card.next_review_date))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/flashcards/review">
                Start Review Session
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Learning Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Tools</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Create Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Generate AI-powered flashcards or create your own manually.
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/flashcards?create=true">Create Cards</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Review Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Practice with your existing flashcards using spaced repetition.
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/flashcards">Browse Cards</Link>
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
