"use client";
import { FlashcardResult } from "@/components/FlashcardResult";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Lightbulb, Loader, Search } from "lucide-react";
import { KeyboardEvent, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<null | {
    word: string;
    translation: string;
    phonetic: string;
    pos: string;
    example: string;
    notes: string;
  }>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Please enter a word or phrase");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/flashcard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: text }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      toast.success("Flashcard generated successfully");
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      toast.error("Failed to generate flashcard");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
      if (resultRef.current) {
        resultRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Language Flashcard Generator
          </CardTitle>
          <CardDescription>
            Enter a word or short phrase to generate a language learning
            flashcard with translation and usage examples.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="word-input" className="text-sm font-medium">
              Word or Phrase
            </label>
            <div className="flex gap-2">
              <Input
                id="word-input"
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a word or phrase (e.g., hello, good morning)"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="gap-1"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isLoading ? "Generating..." : "Analyze"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to submit or click the Analyze button
            </p>
          </div>
        </CardContent>
      </Card>

      {!result && !isLoading && !error && (
        <div className="flex items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
          <div className="flex flex-col items-center text-center text-muted-foreground gap-2">
            <Lightbulb className="h-10 w-10 opacity-50" />
            <h3 className="font-medium">Enter a word above to get started</h3>
            <p className="text-sm max-w-md">
              Our AI will analyze the word and generate a comprehensive
              flashcard with translation, pronunciation, examples, and usage
              notes.
            </p>
          </div>
        </div>
      )}

      <div ref={resultRef}>
        {isLoading && (
          <Card className="p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader className="animate-spin h-8 w-8 text-primary" />
              <p className="text-muted-foreground">
                Generating your flashcard...
              </p>
            </div>
          </Card>
        )}
        {error && (
          <Card className="border-red-200 bg-red-50 p-4">
            <p className="text-red-500 text-center">{error}</p>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please check your connection and try again
            </p>
          </Card>
        )}
        {result && (
          <FlashcardResult
            word={result.word}
            translation={result.translation}
            phonetic={result.phonetic}
            pos={result.pos}
            example={result.example}
            notes={result.notes}
          />
        )}
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}
