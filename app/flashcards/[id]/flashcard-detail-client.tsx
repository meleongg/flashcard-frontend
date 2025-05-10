"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/lib/constants";
import { getLanguageName, posDescriptions } from "@/lib/language-helpers";
import { FlashcardData } from "@/types/flashcard";
import { ArrowLeft, Edit, Loader, Volume2 } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function FlashcardDetailClient({
  id,
  session,
}: {
  id: string;
  session: Session;
}) {
  const [flashcard, setFlashcard] = useState<FlashcardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFlashcard = async () => {
      try {
        const session = await getSession();
        const token = session?.accessToken;

        const res = await fetch(`${apiUrl}/flashcard/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Flashcard not found");
            router.push("/flashcards");
            return;
          }
          throw new Error("Failed to fetch flashcard");
        }

        const data = await res.json();
        setFlashcard(data);
      } catch (error) {
        console.error("Error fetching flashcard:", error);
        toast.error("Failed to load flashcard");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcard();
  }, [id, router]);

  const playPronunciation = () => {
    if (!flashcard) return;

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(flashcard.word);
    utterance.lang = flashcard.source_lang || "en";
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!flashcard) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Flashcard not found</h2>
          <p className="text-muted-foreground mb-6">
            The flashcard you're looking for doesn't exist or was deleted.
          </p>
          <Link href="/flashcards">
            <Button>Back to Flashcards</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/flashcards">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to flashcards
          </Button>
        </Link>

        <Link href={`/flashcards/${id}/edit`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Flashcard
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/10 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            {flashcard.word}
            <Button
              size="icon"
              variant="ghost"
              onClick={playPronunciation}
              disabled={isSpeaking}
              className="h-8 w-8 rounded-full"
            >
              {isSpeaking ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Phonetic */}
          {flashcard.phonetic && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Pronunciation
              </h3>
              <p className="text-lg font-mono">{flashcard.phonetic}</p>
            </div>
          )}

          {/* Translation */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Translation
            </h3>
            <p className="text-xl">{flashcard.translation}</p>
          </div>

          {/* Part of Speech */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Part of Speech
            </h3>
            <p>{posDescriptions[flashcard.pos] || flashcard.pos}</p>
          </div>

          {/* Example */}
          {flashcard.example && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Example
              </h3>
              <p className="italic">"{flashcard.example}"</p>
            </div>
          )}

          {/* Notes */}
          {flashcard.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Notes
              </h3>
              <p>{flashcard.notes}</p>
            </div>
          )}

          {/* Language Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Languages
            </h3>
            <p>
              {getLanguageName(flashcard.source_lang)} →{" "}
              {getLanguageName(flashcard.target_lang)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional study components could go here */}
      {/* Flashcard practice section, related words, etc. */}
    </div>
  );
}
