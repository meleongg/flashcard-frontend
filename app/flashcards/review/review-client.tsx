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
import { Progress } from "@/components/ui/progress";
import { apiUrl } from "@/lib/constants";
import { getLanguageName, posDescriptions } from "@/lib/language-helpers";
import { cn } from "@/lib/utils";
import { FlashcardResponse } from "@/types/flashcard";
import {
  ReviewRating,
  ReviewSessionSummary,
  ReviewStats,
  ReviewStatus,
} from "@/types/review";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader,
  Rotate3D,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function FlashcardReviewClient({ session }: { session: Session }) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(
    ReviewStatus.LOADING
  );
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    cardsReviewed: 0,
    correct: 0,
    wrong: 0,
    remaining: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for tracking the review session
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Add a new state for the session summary
  const [sessionSummary, setSessionSummary] =
    useState<ReviewSessionSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    // Check URL for session parameter
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get("session");

    if (sessionParam) {
      setSessionId(sessionParam);
      // Since we already have a session ID, we can auto-start the review
      // after fetching cards
      fetchCards(true);
    } else {
      fetchCards(false);
    }
  }, []);

  const fetchCards = async (autoStart = false) => {
    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const res = await fetch(`${apiUrl}/flashcards/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch review cards: ${res.status}`);
      }

      const data = await res.json();
      setCards(data);

      if (data.length === 0) {
        setReviewStatus(ReviewStatus.EMPTY);
        return;
      }

      setReviewStats({
        cardsReviewed: 0,
        correct: 0,
        wrong: 0,
        remaining: data.length,
      });

      // If we were passed a session ID in the URL, auto-start the review
      if (autoStart && sessionId) {
        setReviewStatus(ReviewStatus.IN_PROGRESS);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      } else {
        setReviewStatus(ReviewStatus.READY);
      }
    } catch (error) {
      console.error("Error fetching review cards:", error);
      setReviewStatus(ReviewStatus.ERROR);
      toast.error("Failed to load review cards. Please try again.");
    }
  };

  // Modified to start a review session
  const startReview = async () => {
    if (cards.length === 0) return;

    try {
      // Start a new review session
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const startRes = await fetch(`${apiUrl}/review-sessions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!startRes.ok) {
        throw new Error("Failed to start review session");
      }

      const { session_id } = await startRes.json();
      setSessionId(session_id);

      // Initialize review
      setReviewStatus(ReviewStatus.IN_PROGRESS);
      setCurrentCardIndex(0);
      setIsFlipped(false);

      toast.success("Review session started");
    } catch (error) {
      console.error("Error starting review session:", error);
      toast.error("Failed to start review session. Please try again.");
    }
  };

  const fetchSessionSummary = async (sessionId: string) => {
    if (!sessionId) return;

    setIsSummaryLoading(true);
    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const res = await fetch(
        `${apiUrl}/review-sessions/${sessionId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch session summary: ${res.status}`);
      }

      const summaryData = await res.json();
      setSessionSummary(summaryData);
    } catch (error) {
      console.error("Error fetching session summary:", error);
      toast.error("Failed to load session details");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(true);
    setReviewStatus(ReviewStatus.FLIPPED);
  };

  const playAudio = () => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    // Use browser's speech synthesis
    const utterance = new SpeechSynthesisUtterance(currentCard.word);
    utterance.lang =
      currentCard.source_lang === "zh"
        ? "zh-CN"
        : currentCard.source_lang === "fr"
        ? "fr-FR"
        : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Updated to include session_id
  const submitReview = async (quality: ReviewRating) => {
    if (isSubmitting || !sessionId) return;

    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    setIsSubmitting(true);

    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      // Use the session-based endpoint
      const res = await fetch(`${apiUrl}/review-sessions/${sessionId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flashcard_id: currentCard.id,
          quality,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to submit review: ${res.status}`);
      }

      // Update review stats - consider quality 3 or higher as "correct"
      setReviewStats((prev) => ({
        ...prev,
        cardsReviewed: prev.cardsReviewed + 1,
        correct: quality >= ReviewRating.GOOD ? prev.correct + 1 : prev.correct,
        wrong: quality < ReviewRating.GOOD ? prev.wrong + 1 : prev.wrong,
        remaining: prev.remaining - 1,
      }));

      // Move to next card or complete review
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
        setIsFlipped(false);
        setReviewStatus(ReviewStatus.IN_PROGRESS);
      } else {
        // If this was the last card, finish the review and fetch summary
        setReviewStatus(ReviewStatus.COMPLETE);

        // Fetch the session summary
        if (sessionId) {
          fetchSessionSummary(sessionId);
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to save review result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated to pass sessionId
  const resetCard = async () => {
    if (isSubmitting || !currentCard || !sessionId) return;

    setIsSubmitting(true);
    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const res = await fetch(`${apiUrl}/flashcards/${currentCard.id}/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Include session_id if your reset endpoint needs it
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to reset card: ${res.status}`);
      }

      toast.success("Card review progress reset successfully");

      // Move to next card
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // If this was the last card, just complete the review
        setReviewStatus(ReviewStatus.COMPLETE);
      }
    } catch (error) {
      console.error("Error resetting card:", error);
      toast.error("Failed to reset card progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCard = cards[currentCardIndex];
  const progress = cards.length ? (currentCardIndex / cards.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header with session status indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flashcard Review</h1>
          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId.substring(0, 8)}...
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      {reviewStatus === ReviewStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading cards for review...</p>
        </div>
      )}

      {reviewStatus === ReviewStatus.ERROR && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle>Error Loading Cards</CardTitle>
            <CardDescription>
              There was a problem loading your review cards.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => fetchCards(false)}>Try Again</Button>
          </CardFooter>
        </Card>
      )}

      {reviewStatus === ReviewStatus.EMPTY && (
        <Card>
          <CardHeader>
            <CardTitle>No Cards Due for Review</CardTitle>
            <CardDescription>
              You don't have any flashcards due for review right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Great job keeping up with your reviews! Check back later or browse
              your flashcards.
            </p>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/flashcards">Browse Flashcards</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/flashcards?create=true">Create New Cards</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {reviewStatus === ReviewStatus.READY && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Review</CardTitle>
            <CardDescription>
              You have {cards.length} card{cards.length !== 1 ? "s" : ""} due
              for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Start Review" to begin your session. Try to recall each
              word before flipping the card.
            </p>
            <div className="flex items-center justify-between text-sm">
              <span>
                Cards to review: <strong>{cards.length}</strong>
              </span>
              <span>
                Estimated time:{" "}
                <strong>{Math.ceil(cards.length * 0.5)} min</strong>
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={startReview} className="w-full">
              Start Review
            </Button>
          </CardFooter>
        </Card>
      )}

      {(reviewStatus === ReviewStatus.IN_PROGRESS ||
        reviewStatus === ReviewStatus.FLIPPED) &&
        currentCard && (
          <>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>
                {currentCardIndex + 1} of {cards.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1" />

            <div className="py-4">
              <Card
                className={cn(
                  "cursor-pointer relative overflow-hidden transition-all",
                  isFlipped && "ring-2 ring-primary/20"
                )}
              >
                {/* Add Reset button here, at the top of the Card */}
                {isFlipped && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetCard}
                    disabled={isSubmitting}
                    className="text-xs opacity-70 hover:opacity-100 absolute top-2 right-2 z-10"
                  >
                    Reset Progress
                  </Button>
                )}

                <div
                  onClick={() => !isFlipped && flipCard()}
                  className={cn(
                    "min-h-[300px] flex flex-col items-center justify-center p-8",
                    !isFlipped && "hover:bg-muted/50"
                  )}
                >
                  {/* Card Front */}
                  <div className="mb-2 text-muted-foreground text-sm">
                    {getLanguageName(currentCard.source_lang)}
                  </div>

                  <div className="text-3xl font-bold text-center mb-4">
                    {currentCard.word}
                  </div>

                  {currentCard.phonetic && (
                    <div className="text-sm font-mono mb-4 text-muted-foreground">
                      {currentCard.phonetic}
                    </div>
                  )}

                  <div className="mt-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio();
                      }}
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {!isFlipped && (
                    <div className="absolute bottom-4 text-sm text-muted-foreground flex items-center gap-1">
                      <Rotate3D className="h-4 w-4" /> Tap to flip
                    </div>
                  )}
                </div>

                {/* Card Back (revealed on flip) */}
                {isFlipped && (
                  <div className="border-t px-6 py-4 space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {getLanguageName(currentCard.target_lang)}
                      </div>
                      <div className="text-xl font-medium">
                        {currentCard.translation}
                      </div>
                    </div>

                    {currentCard.pos && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Part of Speech
                        </div>
                        <div className="text-sm">
                          {posDescriptions[currentCard.pos] || currentCard.pos}
                        </div>
                      </div>
                    )}

                    {currentCard.example && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Example
                        </div>
                        <div className="text-sm italic">
                          "{currentCard.example}"
                        </div>
                      </div>
                    )}

                    {currentCard.notes && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Notes
                        </div>
                        <div className="text-sm">{currentCard.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Review controls - only show when card is flipped */}
            {isFlipped && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => submitReview(ReviewRating.DIFFICULT)}
                  disabled={isSubmitting}
                >
                  <ThumbsDown className="h-5 w-5 text-destructive mb-1" />
                  <span className="text-xs font-medium">Again</span>
                  <span className="text-[10px] text-muted-foreground">
                    Soon
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => submitReview(ReviewRating.GOOD)}
                  disabled={isSubmitting}
                >
                  <ThumbsDown className="h-5 w-5 text-amber-500 mb-1" />
                  <span className="text-xs font-medium">Hard</span>
                  <span className="text-[10px] text-muted-foreground">
                    Later Today
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => submitReview(ReviewRating.EASY)}
                  disabled={isSubmitting}
                >
                  <ThumbsUp className="h-5 w-5 text-lime-600 mb-1" />
                  <span className="text-xs font-medium">Good</span>
                  <span className="text-[10px] text-muted-foreground">
                    Tomorrow
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => submitReview(ReviewRating.PERFECT)}
                  disabled={isSubmitting}
                >
                  <ThumbsUp className="h-5 w-5 text-primary mb-1" />
                  <span className="text-xs font-medium">Easy</span>
                  <span className="text-[10px] text-muted-foreground">
                    3+ Days
                  </span>
                </Button>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentCardIndex > 0) {
                    setCurrentCardIndex((prev) => prev - 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentCardIndex === 0 || isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              {!isFlipped ? (
                <Button size="sm" onClick={flipCard}>
                  Flip Card
                  <Rotate3D className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentCardIndex < cards.length - 1) {
                      setCurrentCardIndex((prev) => prev + 1);
                      setIsFlipped(false);
                    }
                  }}
                  disabled={
                    currentCardIndex === cards.length - 1 || isSubmitting
                  }
                >
                  Skip
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

      {reviewStatus === ReviewStatus.COMPLETE && (
        <Card>
          <CardHeader>
            <CardTitle>Review Complete! 🎉</CardTitle>
            <CardDescription>
              You've completed your review session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {reviewStats.cardsReviewed}
                </div>
                <div className="text-xs text-muted-foreground">
                  Cards Reviewed
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {reviewStats.correct}
                </div>
                <div className="text-xs text-muted-foreground">Remembered</div>
              </div>
              <div className="bg-destructive/10 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-destructive">
                  {reviewStats.wrong}
                </div>
                <div className="text-xs text-muted-foreground">Forgot</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {reviewStats.correct > 0
                    ? Math.round(
                        (reviewStats.correct / reviewStats.cardsReviewed) * 100
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
            </div>

            {/* New section for the session summary */}
            {isSummaryLoading ? (
              <div className="flex justify-center py-4">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sessionSummary ? (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Session Details</h3>

                {/* Average rating */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Average Rating:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-medium">
                      {sessionSummary.average_rating.toFixed(1)}
                    </div>
                    <RatingVisual rating={sessionSummary.average_rating} />
                  </div>
                </div>

                {/* Rating breakdown */}
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-3">Rating Breakdown</h4>

                  <div className="space-y-2">
                    {Object.entries(sessionSummary.ratings_breakdown)
                      .filter(([_, count]) => count > 0) // Only show ratings with counts
                      .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // Sort by rating (highest first)
                      .map(([rating, count]) => (
                        <div
                          key={rating}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <RatingBadge rating={parseInt(rating)} />
                            <span className="text-sm">
                              {getRatingLabel(parseInt(rating))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-primary/10 rounded-full w-24 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${
                                    (count / sessionSummary.total_cards) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}

            <p className="text-sm text-center text-muted-foreground mt-6">
              Great job! Regular reviews improve long-term memory retention.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/flashcards">View All Flashcards</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  // These are helper components for displaying the rating visually
  function RatingVisual({ rating }: { rating: number }) {
    const fullStars = Math.floor(rating);
    const remainder = rating - fullStars;
    const stars = [];

    // Add full stars
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-500">
            ★
          </span>
        );
      } else if (i === fullStars && remainder > 0) {
        // Show partial star
        stars.push(
          <span key={i} className="text-yellow-500 opacity-50">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-muted-foreground opacity-30">
            ★
          </span>
        );
      }
    }

    return <div className="flex">{stars}</div>;
  }

  function RatingBadge({ rating }: { rating: number }) {
    const colors = {
      0: "bg-red-500/10 text-red-600",
      1: "bg-red-400/10 text-red-500",
      2: "bg-amber-400/10 text-amber-500",
      3: "bg-lime-400/10 text-lime-600",
      4: "bg-green-400/10 text-green-600",
      5: "bg-primary/10 text-primary",
    };

    return (
      <span
        className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-medium ${
          colors[rating as keyof typeof colors]
        }`}
      >
        {rating}
      </span>
    );
  }

  function getRatingLabel(rating: number): string {
    switch (rating) {
      case 0:
        return "Failed";
      case 1:
        return "Bad";
      case 2:
        return "Difficult";
      case 3:
        return "Good";
      case 4:
        return "Easy";
      case 5:
        return "Perfect";
      default:
        return "";
    }
  }
}
