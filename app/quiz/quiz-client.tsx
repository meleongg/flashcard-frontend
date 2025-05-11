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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiUrl } from "@/lib/constants";
import { getLanguageName } from "@/lib/language-helpers";
import { FlashcardResponse } from "@/types/flashcard";
import { ArrowRight, Check, Loader, RefreshCw, Volume2, X } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function QuizClient({ session }: { session: Session }) {
  const router = useRouter();

  // Setup states
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [quizOptions, setQuizOptions] = useState({
    cardCount: 10,
    includeReverse: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizCards, setQuizCards] = useState<FlashcardResponse[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    incorrect: number;
  }>({
    correct: 0,
    incorrect: 0,
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch folders");

      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error("Error fetching folders:", err);
      toast.error("Failed to load folders");
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      // Construct URL with query params
      const url = new URL(`${apiUrl}/quiz`);
      url.searchParams.append("count", quizOptions.cardCount.toString());
      url.searchParams.append(
        "include_reverse",
        quizOptions.includeReverse.toString()
      );

      if (selectedFolderId) {
        url.searchParams.append("folder_id", selectedFolderId);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch quiz cards");

      const data = await res.json();

      if (data.length === 0) {
        toast.error("No flashcards found with the selected criteria");
        return;
      }

      // Reset quiz state and start quiz
      setQuizCards(data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setResults({ correct: 0, incorrect: 0 });
      setIsQuizActive(true);
    } catch (err) {
      console.error("Error starting quiz:", err);
      toast.error("Failed to start quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const playPronunciation = () => {
    if (!quizCards[currentCardIndex]) return;

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(
      quizCards[currentCardIndex].word
    );
    utterance.lang = quizCards[currentCardIndex].source_lang || "en";
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const handleCardResult = (correct: boolean) => {
    setResults((prev) => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: correct ? prev.incorrect : prev.incorrect + 1,
    }));

    setCurrentCardIndex(currentCardIndex + 1);
    setIsFlipped(false);

    // Show toast only when completing the last card
    if (currentCardIndex === quizCards.length - 1) {
      toast.success("Quiz completed!");
    }
  };

  const restartQuiz = () => {
    setIsQuizActive(false);
    setQuizCards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setResults({ correct: 0, incorrect: 0 });
  };

  // Calculate progress
  const progress =
    quizCards.length > 0
      ? Math.round((currentCardIndex / quizCards.length) * 100)
      : 0;

  // Get current card
  const currentCard = quizCards[currentCardIndex];
  const isQuizComplete =
    currentCardIndex >= quizCards.length && quizCards.length > 0;

  if (isQuizActive && !isQuizComplete) {
    return (
      <div className="max-w-lg mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Quiz Mode</h1>
          <Button variant="outline" size="sm" onClick={restartQuiz}>
            Exit Quiz
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-sm">
          <span>
            Card {currentCardIndex + 1} of {quizCards.length}
          </span>
          <span>
            <span className="text-green-600">{results.correct} correct</span> ·
            <span className="text-red-600 ml-1">
              {results.incorrect} incorrect
            </span>
          </span>
        </div>

        {/* Card display */}
        {currentCard && (
          <Card className="w-full overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  {isFlipped ? "Translation" : "Word"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {isFlipped ? (
                    <>
                      {getLanguageName(currentCard.target_lang || "unknown")}
                      <span className="mx-1">←</span>
                      {getLanguageName(currentCard.source_lang || "unknown")}
                    </>
                  ) : (
                    <>
                      {getLanguageName(currentCard.source_lang || "unknown")}
                      <span className="mx-1">→</span>
                      {getLanguageName(currentCard.target_lang || "unknown")}
                    </>
                  )}
                </p>
                {!isFlipped && currentCard.source_lang && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full"
                    onClick={playPronunciation}
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="min-h-[100px] flex flex-col items-center justify-center">
                <p className="text-3xl font-medium text-center">
                  {isFlipped ? currentCard.translation : currentCard.word}
                </p>
                {isFlipped && currentCard.phonetic && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentCard.phonetic}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 bg-muted/20 p-4">
              {!isFlipped ? (
                <Button onClick={() => setIsFlipped(true)} className="w-full">
                  Show Translation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    onClick={() => handleCardResult(false)}
                    variant="outline"
                    className="border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="mr-1 h-4 w-4" /> Incorrect
                  </Button>
                  <Button
                    onClick={() => handleCardResult(true)}
                    variant="outline"
                    className="border-green-200 hover:bg-green-50 hover:text-green-600"
                  >
                    <Check className="mr-1 h-4 w-4" /> Correct
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }

  if (isQuizComplete) {
    const score =
      results.correct + results.incorrect > 0
        ? Math.round(
            (results.correct / (results.correct + results.incorrect)) * 100
          )
        : 0;

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Quiz Results</h1>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Complete!</CardTitle>
            <CardDescription>
              You've completed the quiz. Here are your results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <p className="text-muted-foreground">
                You got {results.correct} out of{" "}
                {results.correct + results.incorrect} cards correct.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {results.correct}
                </div>
                <p className="text-green-600">Correct</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {results.incorrect}
                </div>
                <p className="text-red-600">Incorrect</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={restartQuiz}>
              <RefreshCw className="mr-2 h-4 w-4" />
              New Quiz
            </Button>
            <Button onClick={() => startQuiz()}>Retry Same Cards</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Quiz Mode</h1>

      <Card>
        <CardHeader>
          <CardTitle>Start a New Quiz</CardTitle>
          <CardDescription>
            Test your knowledge with flashcards from your collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder">Select Folder</Label>
            <Select
              value={selectedFolderId}
              onValueChange={setSelectedFolderId}
            >
              <SelectTrigger id="folder">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flashcards</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardCount">Number of Cards</Label>
            <Input
              id="cardCount"
              type="number"
              min={1}
              max={100}
              value={quizOptions.cardCount}
              onChange={(e) =>
                setQuizOptions({
                  ...quizOptions,
                  cardCount: parseInt(e.target.value) || 10,
                })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeReverse"
              checked={quizOptions.includeReverse}
              onCheckedChange={(checked) =>
                setQuizOptions({
                  ...quizOptions,
                  includeReverse: !!checked,
                })
              }
            />
            <label
              htmlFor="includeReverse"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include reverse cards (test translation → word)
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={startQuiz} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Start Quiz"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
