"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  FolderOpen,
  Loader,
  X,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface QuizSession {
  id: string;
  folder_id: string | null;
  folder_name?: string;
  include_reverse: boolean;
  card_count: number;
  created_at: string;
  answers: { is_correct: boolean }[];
}

export function QuizHistoryClient({ session }: { session: Session }) {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      try {
        const sessionObj = await getSession();
        const token = sessionObj?.accessToken;

        const res = await fetch(`${apiUrl}/quiz/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch sessions: ${res.status}`);
        }

        const data = await res.json();
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load quiz history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessions();
  }, []);

  const getSessionScore = (session: QuizSession) => {
    if (!session.answers || session.answers.length === 0) return 0;
    const correctCount = session.answers.filter((a) => a.is_correct).length;
    return Math.round((correctCount / session.answers.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/quiz">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Quiz History</h1>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((quizSession) => {
            const score = getSessionScore(quizSession);
            const totalAnswers = quizSession.answers?.length || 0;
            const correctAnswers =
              quizSession.answers?.filter((a) => a.is_correct).length || 0;

            return (
              <Link
                href={`/quiz/session/${quizSession.id}`}
                key={quizSession.id}
                className="block hover:no-underline"
              >
                <div className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Quiz Session -{" "}
                        {formatDate(new Date(quizSession.created_at))}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
                        {quizSession.folder_name && (
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />
                            {quizSession.folder_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quizSession.card_count} cards
                          {quizSession.include_reverse &&
                            " (with reverse mode)"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{score}%</div>
                        <div className="text-xs text-muted-foreground">
                          Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-green-600">
                          {correctAnswers}
                          <span className="text-muted-foreground text-xs">
                            /{totalAnswers}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Correct
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            You haven't taken any quizzes yet.
          </p>
          <Button asChild>
            <Link href="/quiz">Start Your First Quiz</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
