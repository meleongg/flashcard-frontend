"use client";
import { FlashcardResult } from "@/components/FlashcardResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { useRef, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<null | {
    translation: string;
    example: string;
    pos_tags: { word: string; pos: string; dep: string }[];
  }>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/pos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: text }),
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
            original={text}
            translation={result.translation}
            example={result.example}
            posTags={result.pos_tags}
          />
        )}
      </div>
    </main>
  );
}
