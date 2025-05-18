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

enum ReviewStatus {
  LOADING,
  READY,
  IN_PROGRESS,
  FLIPPED,
  COMPLETE,
  ERROR,
  EMPTY,
}

enum ReviewRating {
  FAILED = 0, // Complete failure to recall
  BAD = 1, // Incorrect response but recognized answer
  DIFFICULT = 2, // Correct response with significant difficulty
  GOOD = 3, // Correct response with some effort
  EASY = 4, // Correct response with little effort
  PERFECT = 5, // Perfect recall
}

interface ReviewStats {
  cardsReviewed: number;
  correct: number;
  wrong: number;
  remaining: number;
}

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

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
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
      setReviewStatus(ReviewStatus.READY);
    } catch (error) {
      console.error("Error fetching review cards:", error);
      setReviewStatus(ReviewStatus.ERROR);
      toast.error("Failed to load review cards. Please try again.");
    }
  };

  const startReview = () => {
    if (cards.length > 0) {
      setReviewStatus(ReviewStatus.IN_PROGRESS);
      setCurrentCardIndex(0);
      setIsFlipped(false);
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

  const submitReview = async (quality: ReviewRating) => {
    if (isSubmitting) return;

    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    setIsSubmitting(true);

    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      // Updated to match the API endpoint format
      const res = await fetch(`${apiUrl}/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Using the quality parameter format the API expects
        body: JSON.stringify({ quality }),
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
        setReviewStatus(ReviewStatus.COMPLETE);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to save review result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCard = async () => {
    if (isSubmitting || !currentCard) return;

    setIsSubmitting(true);
    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const res = await fetch(`${apiUrl}/flashcards/${currentCard.id}/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcard Review</h1>
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
            <Button onClick={fetchCards}>Try Again</Button>
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
            <p className="text-sm text-center text-muted-foreground">
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
}
