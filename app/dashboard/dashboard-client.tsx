"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/context/app-context";
import { apiUrl } from "@/lib/constants";
import { getLanguageName, posDescriptions } from "@/lib/language-helpers";
import { cn } from "@/lib/utils";
import { FlashcardData } from "@/types/flashcard";
import { BookOpen, Lightbulb, Loader, Search } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

export function DashboardClient({ session }: { session: Session }) {
  // Get shared state from context
  const {
    languageDirection,
    setLanguageDirection,
    selectedFolderId,
    setSelectedFolderId,
    refreshFlashcards,
  } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [previewFlashcard, setPreviewFlashcard] =
    useState<FlashcardData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [foldersLoading, setFoldersLoading] = useState(false);

  const MAX_WORD_LENGTH = 50;
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Fetch folders for the dropdown
  useEffect(() => {
    fetchFolders();
  }, [session]);

  const fetchFolders = async () => {
    setFoldersLoading(true);

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
    } finally {
      setFoldersLoading(false);
    }
  };

  // Generate preview without saving
  const handleGenerate = async () => {
    // Reset error state
    setError(null);

    // Input validation
    if (!text.trim()) {
      setInputError("Please enter a word or phrase");
      return;
    }

    if (text.length > MAX_WORD_LENGTH) {
      setInputError(`Input must be ${MAX_WORD_LENGTH} characters or less`);
      toast.error(`Input too long (maximum ${MAX_WORD_LENGTH} characters)`);
      return;
    }

    setIsLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      if (!token) {
        setError("Authentication error. Please try logging in again.");
        toast.error("Authentication error");
        return;
      }

      // Parse the language direction into source and target
      const [sourceLanguage, targetLanguage] = languageDirection.split("-");

      const res = await fetch(`${apiUrl}/flashcard-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          word: text,
          source_lang: sourceLanguage,
          target_lang: targetLanguage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Server responded with ${res.status}`;
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Set as preview (doesn't save to backend yet)
      setPreviewFlashcard(data);
      setIsEditing(false);
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err: any) {
      console.error("Generate error:", err);
      setError(
        err.message || "Failed to generate flashcard. Please try again."
      );
      toast.error("Failed to generate flashcard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) handleGenerate();
  };

  // Update preview state when editing
  const updatePreview = (field: keyof FlashcardData, value: string) => {
    setPreviewFlashcard((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Save the flashcard to backend
  const handleSave = async () => {
    if (!previewFlashcard) return;

    try {
      const session = await getSession();
      const token = session?.accessToken;

      // Parse the language direction
      const [sourceLanguage, targetLanguage] = languageDirection.split("-");

      const payload = {
        ...previewFlashcard,
        folder_id:
          selectedFolderId === "none" || selectedFolderId === "all"
            ? ""
            : selectedFolderId,
        source_lang:
          sourceLanguage === "auto"
            ? previewFlashcard.source_lang
            : sourceLanguage,
        target_lang: targetLanguage,
      };

      const res = await fetch(`${apiUrl}/flashcard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      // Signal other components to refresh their flashcard lists
      refreshFlashcards();
      toast.success("Flashcard saved successfully");

      // Reset the form
      setText("");
      setPreviewFlashcard(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save flashcard");
    }
  };

  // Discard the preview
  const handleDiscard = () => {
    setPreviewFlashcard(null);
    // Optionally clear the input too
    // setText("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Language Flashcard Generator
          </CardTitle>
          <CardDescription>
            Enter a word or short phrase to generate a language learning
            flashcard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={handleKeyPress}
                placeholder="Enter a word or phrase..."
                className={cn("flex-1", inputError && "border-red-500")}
                disabled={isLoading}
                maxLength={MAX_WORD_LENGTH}
              />

              <Select
                value={languageDirection}
                onValueChange={(val) => setLanguageDirection(val)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Translate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-zh">Auto → Mandarin</SelectItem>
                  <SelectItem value="auto-zh">Auto → French</SelectItem>
                  <SelectItem value="auto-en">Auto → English</SelectItem>
                  <SelectItem value="en-zh">English → Mandarin</SelectItem>
                  <SelectItem value="zh-en">Mandarin → English</SelectItem>
                  <SelectItem value="en-fr">English → French</SelectItem>
                  <SelectItem value="fr-en">French → English</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="gap-1"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isLoading ? "Generating..." : "Generate"}
              </Button>
            </div>

            {/* Error message */}
            {inputError && <p className="text-xs text-red-500">{inputError}</p>}
          </div>
        </CardContent>
      </Card>

      <div ref={resultRef}>
        {previewFlashcard && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Preview Flashcard</CardTitle>
                <CardDescription>
                  {languageDirection.startsWith("auto")
                    ? `${
                        previewFlashcard.source_lang
                          ? getLanguageName(previewFlashcard.source_lang)
                          : "Auto-detect"
                      } → ${getLanguageName(languageDirection.split("-")[1])}`
                    : `${getLanguageName(
                        languageDirection.split("-")[0]
                      )} → ${getLanguageName(languageDirection.split("-")[1])}`}
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDiscard}>
                  Discard
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Flashcard
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                {/* Word */}
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="word">Word</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                  </div>
                  {isEditing ? (
                    <Input
                      id="word"
                      value={previewFlashcard.word}
                      onChange={(e) => updatePreview("word", e.target.value)}
                    />
                  ) : (
                    <div className="text-2xl font-bold">
                      {previewFlashcard.word}
                    </div>
                  )}
                </div>

                {/* Translation */}
                <div className="grid gap-2">
                  <Label htmlFor="translation">Translation</Label>
                  {isEditing ? (
                    <Input
                      id="translation"
                      value={previewFlashcard.translation}
                      onChange={(e) =>
                        updatePreview("translation", e.target.value)
                      }
                    />
                  ) : (
                    <div className="text-lg">
                      {previewFlashcard.translation}
                    </div>
                  )}
                </div>

                {/* Phonetic pronunciation */}
                <div className="grid gap-2">
                  <Label htmlFor="phonetic">Pronunciation</Label>
                  {isEditing ? (
                    <Input
                      id="phonetic"
                      value={previewFlashcard.phonetic}
                      onChange={(e) =>
                        updatePreview("phonetic", e.target.value)
                      }
                      placeholder="Phonetic pronunciation"
                    />
                  ) : (
                    <div className="text-base font-mono">
                      {previewFlashcard.phonetic || "—"}
                    </div>
                  )}
                </div>

                {/* Part of speech */}
                <div className="grid gap-2">
                  <Label htmlFor="pos">Part of Speech</Label>
                  {isEditing ? (
                    <Select
                      value={previewFlashcard.pos}
                      onValueChange={(val) => updatePreview("pos", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOUN">Noun</SelectItem>
                        <SelectItem value="VERB">Verb</SelectItem>
                        <SelectItem value="ADJ">Adjective</SelectItem>
                        <SelectItem value="ADV">Adverb</SelectItem>
                        <SelectItem value="PRON">Pronoun</SelectItem>
                        <SelectItem value="PREP">Preposition</SelectItem>
                        <SelectItem value="CONJ">Conjunction</SelectItem>
                        <SelectItem value="INTJ">Interjection</SelectItem>
                        <SelectItem value="DET">Determiner</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-base">
                      {posDescriptions[previewFlashcard.pos] ||
                        previewFlashcard.pos}
                    </div>
                  )}
                </div>

                {/* Example sentence */}
                <div className="grid gap-2">
                  <Label htmlFor="example">Example</Label>
                  {isEditing ? (
                    <textarea
                      id="example"
                      value={previewFlashcard.example}
                      onChange={(e) => updatePreview("example", e.target.value)}
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Example sentence using this word"
                    ></textarea>
                  ) : (
                    <div className="text-base italic">
                      "{previewFlashcard.example || "—"}"
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  {isEditing ? (
                    <textarea
                      id="notes"
                      value={previewFlashcard.notes}
                      onChange={(e) => updatePreview("notes", e.target.value)}
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Any additional notes about the word"
                    ></textarea>
                  ) : (
                    <div className="text-base">
                      {previewFlashcard.notes || "—"}
                    </div>
                  )}
                </div>

                {/* Folder selection */}
                <div className="grid gap-2">
                  <Label>Folder</Label>
                  <Select
                    value={selectedFolderId}
                    onValueChange={(val) => {
                      setSelectedFolderId(val);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          foldersLoading
                            ? "Loading folders..."
                            : "Add to folder"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders.length === 0 && !foldersLoading ? (
                        <SelectItem value="no-folders" disabled>
                          No folders available
                        </SelectItem>
                      ) : (
                        folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
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

        {/* Error state */}
        {error && (
          <Card className="border-red-200 bg-red-50 p-4">
            <p className="text-red-500 text-center">{error}</p>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please check your connection and try again
            </p>
          </Card>
        )}

        {/* Empty state */}
        {!previewFlashcard && !isLoading && !error && (
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
      </div>

      {/* Link to view all flashcards */}
      <div className="flex justify-center">
        <Link href="/flashcards">
          <Button variant="outline">View All Flashcards</Button>
        </Link>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}
