"use client";

import { AuthButtons } from "@/components/AuthButtons";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FlashcardData, FlashcardResponse } from "@/types/flashcard";
import { Folder as FlashcardFolder } from "@/types/folder";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Folder,
  Lightbulb,
  Loader,
  Search,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function DashboardClient({ session }: { session: Session }) {
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
  const [allFlashcards, setAllFlashcards] = useState<FlashcardResponse[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [previewFlashcard, setPreviewFlashcard] =
    useState<FlashcardData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const MAX_WORD_LENGTH = 50;

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
      // Don't show error toast for folders as it's not critical
    }
  };

  const fetchFlashcards = async (currentPage = 0) => {
    setIsLoadingCards(true);

    try {
      const session = await getSession();
      const token = session?.accessToken;

      // Use URL constructor for more robust parameter handling
      const url = new URL(`${apiUrl}/flashcards`);

      // Add query parameters
      url.searchParams.append("skip", (currentPage * pageSize).toString());
      url.searchParams.append("limit", pageSize.toString());

      // Only add folder_id if it's not "all"
      if (selectedFolderId !== "all") {
        url.searchParams.append("folder_id", selectedFolderId);
      }

      console.log(`Fetching flashcards from: ${url.toString()}`);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch flashcards: ${res.status}`);

      const data = await res.json();
      console.log("Received flashcards data:", data);

      setAllFlashcards(data.flashcards);
      setTotalFlashcards(data.total);
    } catch (err) {
      console.error("Error fetching flashcards:", err);
      toast.error("Failed to load flashcards");
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [session]);

  useEffect(() => {
    fetchFlashcards(page);
  }, [page, selectedFolderId]);

  const handleSubmit = async () => {
    // Reset error states
    setInputError(null);
    setError(null);

    // Validation
    if (!text.trim()) {
      setInputError("Please enter a word or phrase");
      toast.error("Please enter a word or phrase");
      return;
    }

    if (text.length > MAX_WORD_LENGTH) {
      setInputError(`Input must be ${MAX_WORD_LENGTH} characters or less`);
      toast.error(`Input too long (maximum ${MAX_WORD_LENGTH} characters)`);
      return;
    }

    // Input is valid, proceed with API call
    setIsLoading(true);

    try {
      const session = await getSession();
      const token = session?.accessToken;

      // Only include folder_id in the payload if it's not "all"
      const payload: { word: string; folder_id?: string } = { word: text };

      if (selectedFolderId !== "all") {
        payload.folder_id = selectedFolderId;
      }

      console.log("Creating flashcard with payload:", payload);

      const res = await fetch(`${apiUrl}/flashcard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResult(data);

      await fetchFlashcards();
      toast.success("Flashcard generated successfully");
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      toast.error("Failed to generate flashcard");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) handleSubmit();
  };

  const deleteFlashcard = async (flashcardId: string) => {
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/flashcard/${flashcardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      // Refresh the flashcards list
      await fetchFlashcards(page);
      toast.success("Flashcard deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete flashcard");
      throw error;
    }
  };

  const editFlashcard = async (
    flashcardId: string,
    data: Partial<FlashcardData & { folder_id?: string }>
  ) => {
    const session = await getSession();
    const token = session?.accessToken;

    try {
      const res = await fetch(`${apiUrl}/flashcard/${flashcardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      // Refresh the flashcards list to show the updated content
      await fetchFlashcards(page);
      toast.success("Flashcard updated successfully");
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to update flashcard");
      throw error;
    }
  };

  // Generate preview without saving
  const handleGenerate = async () => {
    // Input validation
    if (!text.trim()) {
      setInputError("Please enter a word or phrase");
      return;
    }

    setIsLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/flashcard-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word: text }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();

      // Set as preview (doesn't save to backend yet)
      setPreviewFlashcard(data);
      setIsEditing(false); // Start in view mode, not edit mode
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate flashcard");
    } finally {
      setIsLoading(false);
    }
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

      const payload = {
        ...previewFlashcard,
        folder_id: selectedFolderId === "none" ? "" : selectedFolderId,
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

      // Success - update the flashcard list
      await fetchFlashcards(page);
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
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-end">
        <AuthButtons />
      </div>

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

              {/* Source language selector */}
              <Select defaultValue="auto" disabled={isLoading}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="zh">Mandarin</SelectItem>
                  {/* Add more languages */}
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

      {/* Preview Card */}
      {previewFlashcard && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Preview Flashcard</CardTitle>
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
                  <div className="text-lg">{previewFlashcard.translation}</div>
                )}
              </div>

              {/* Other editable fields - pronunciation, examples, etc */}

              {/* Folder selection */}
              <div className="grid gap-2">
                <Label>Folder</Label>
                <Select
                  value={selectedFolderId}
                  onValueChange={(val) => setSelectedFolderId(val)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add to folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {allFlashcards.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your Saved Flashcards</h2>

            {/* Add folder selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Viewing:</span>
              </div>
              <Select
                value={selectedFolderId}
                onValueChange={(value) => {
                  console.log(`Changing folder to: ${value}`); // Debug log
                  setSelectedFolderId(value);
                  setPage(0); // Reset to first page when changing folders
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select folder">
                    {selectedFolderId === "all"
                      ? "All Flashcards"
                      : folders.find((f) => f.id === selectedFolderId)?.name ||
                        "Select folder"}
                  </SelectValue>
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

            <p className="text-sm text-muted-foreground sm:ml-auto">
              Showing {page * pageSize + 1}-
              {Math.min((page + 1) * pageSize, totalFlashcards)} of{" "}
              {totalFlashcards}
            </p>
          </div>

          {isLoadingCards ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <>
              {allFlashcards.length > 0 ? (
                <>
                  {allFlashcards.map((fc) => (
                    <FlashcardResult
                      key={fc.id}
                      id={fc.id}
                      word={fc.word}
                      translation={fc.translation}
                      phonetic={fc.phonetic}
                      pos={fc.pos}
                      example={fc.example}
                      notes={fc.notes}
                      folderId={fc.folder_id}
                      folderName={
                        folders.find((f) => f.id === fc.folder_id)?.name
                      }
                      folders={folders}
                      onDelete={deleteFlashcard}
                      onEdit={editFlashcard}
                    />
                  ))}

                  <div className="flex justify-center items-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0 || isLoadingCards}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>

                    {/* Calculate total pages */}
                    {(() => {
                      const totalPages = Math.ceil(totalFlashcards / pageSize);
                      return (
                        <span className="text-sm">
                          Page {page + 1} of {totalPages}
                        </span>
                      );
                    })()}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={
                        (page + 1) * pageSize >= totalFlashcards ||
                        isLoadingCards
                      }
                      className="cursor-pointer"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-muted/30 p-6 rounded-lg max-w-md">
                    <p className="text-muted-foreground mb-2 font-medium">
                      No flashcards found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFolderId !== "all"
                        ? "This folder doesn't contain any flashcards yet."
                        : "You haven't created any flashcards yet."}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Toaster position="bottom-right" />
    </main>
  );
}
