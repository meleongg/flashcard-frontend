"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/lib/constants";
import { getLanguageName } from "@/lib/language-helpers";
import { formatDate } from "@/lib/utils";
import { QuizSessionDetails } from "@/types/quiz";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  FolderOpen,
  Loader,
  RefreshCw,
  X,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function QuizSessionClient({
  id,
  session,
}: {
  id: string;
  session: Session;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<QuizSessionDetails | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionData() {
      setIsLoading(true);
      try {
        const sessionObj = await getSession();
        const token = sessionObj?.accessToken;

        const res = await fetch(`${apiUrl}/quiz/session/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch session data: ${res.status}`);
        }

        const data = await res.json();
        setSessionData(data);
      } catch (error) {
        console.error("Error fetching session data:", error);
        setError("Failed to load quiz session details");
        toast.error("Failed to load quiz session");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessionData();
  }, [id]);

  // Calculate statistics
  const getTotalAnswers = () => sessionData?.answers.length || 0;
  const getCorrectAnswers = () =>
    sessionData?.answers.filter((a) => a.is_correct).length || 0;
  const getIncorrectAnswers = () =>
    sessionData?.answers.filter((a) => !a.is_correct).length || 0;

  const getScore = () => {
    const total = getTotalAnswers();
    const correct = getCorrectAnswers();
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">
          {error || "Session data not available"}
        </p>
        <Button asChild>
          <Link href="/quiz">Back to Quiz</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex items-center gap-2">
        <Link href="/quiz">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quiz
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">Quiz Session Results</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(new Date(sessionData.created_at))}
          </div>
          {sessionData.folder_name && (
            <div className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              {sessionData.folder_name}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {sessionData.card_count} cards
            {sessionData.include_reverse && " (with reverse mode)"}
          </div>
        </div>
      </div>

      {/* Score summary card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center py-4">
              <div className="text-5xl font-bold mb-1">{getScore()}%</div>
              <p className="text-muted-foreground text-sm">Overall Score</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {getCorrectAnswers()}
                </div>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Correct
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {getIncorrectAnswers()}
                </div>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Incorrect
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed answers */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Card-by-Card Review</h2>

        {sessionData.answers.length > 0 ? (
          <div className="grid gap-4">
            {sessionData.answers.map((answer, index) => (
              <Card
                key={answer.id}
                className={`overflow-hidden border-l-4 ${
                  answer.is_correct ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{index + 1}.</span>
                        {answer.is_correct ? (
                          <span className="flex items-center text-green-600">
                            <Check className="h-4 w-4 mr-1" />
                            Correct
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <X className="h-4 w-4 mr-1" />
                            Incorrect
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-2 md:gap-8 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {getLanguageName(
                              answer.flashcard.source_lang || "unknown"
                            )}
                          </p>
                          <p className="text-lg">{answer.flashcard.word}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {getLanguageName(
                              answer.flashcard.target_lang || "unknown"
                            )}
                          </p>
                          <p className="text-lg">
                            {answer.flashcard.translation}
                          </p>
                          {answer.flashcard.phonetic && (
                            <p className="text-sm text-muted-foreground">
                              {answer.flashcard.phonetic}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              No answer data available for this session.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={() => router.push("/quiz")} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Start New Quiz
        </Button>
      </div>
    </div>
  );
}
