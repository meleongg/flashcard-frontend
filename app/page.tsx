"use client";
import { FlashcardResult } from "@/components/FlashcardResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { useRef, useState } from "react";

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

  const handleSubmit = async () => {
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
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
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

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter a sentence..."
      />
      <Button onClick={handleSubmit}>Analyze</Button>

      <div ref={resultRef}>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="animate-spin h-4 w-4" /> Loading...
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
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
    </main>
  );
}
