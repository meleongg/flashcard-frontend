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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/app-context";
import { apiUrl } from "@/lib/constants";
import { getLanguageName, posDescriptions } from "@/lib/language-helpers";
import { cn } from "@/lib/utils";
import { FlashcardData } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import {
  BookOpen,
  ChevronLeft,
  Lightbulb,
  Loader,
  Save,
  Search,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FlashcardCreatorProps {
  session: Session;
  folders: Folder[];
  onSaveSuccess?: () => void;
  onBack?: () => void;
}

export function FlashcardCreator({
  session,
  folders,
  onSaveSuccess,
  onBack,
}: FlashcardCreatorProps) {
  const {
    languageDirection,
    setLanguageDirection,
    selectedFolderId,
    setSelectedFolderId,
  } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [previewFlashcard, setPreviewFlashcard] =
    useState<FlashcardData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);

  const MAX_WORD_LENGTH = 50;
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    word: "",
    translation: "",
    phonetic: "",
    pos: "",
    example: "",
    notes: "",
  });

  // For the manual form
  const handleManualChange = (field: string, value: string) => {
    setManualForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateManual = async () => {
    if (!manualForm.word || !manualForm.translation) {
      toast.error("Word and translation are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert manual form to flashcard data
      const flashcardData: FlashcardData = {
        word: manualForm.word,
        translation: manualForm.translation,
        phonetic: manualForm.phonetic,
        pos: manualForm.pos || "NOUN",
        example: manualForm.example,
        notes: manualForm.notes,
        source_lang:
          languageDirection.split("-")[0] === "auto"
            ? "en" // Default to English if auto
            : languageDirection.split("-")[0],
        target_lang: languageDirection.split("-")[1],
      };

      // Set as preview
      setPreviewFlashcard(flashcardData);
      setIsEditing(false);

      // Scroll to preview
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err: any) {
      console.error("Error creating manual flashcard:", err);
      setError("Failed to create flashcard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // AI generation
  const handleGenerate = async () => {
    // Validate input
    if (!text || text.trim() === "") {
      setInputError("Please enter a word or phrase");
      return;
    }
    setInputError(null);

    // Clear previous error if any
    setError(null);
    setIsLoading(true);

    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      // Build the request
      const payload = {
        text,
        source_lang:
          languageDirection.split("-")[0] === "auto"
            ? null
            : languageDirection.split("-")[0],
        target_lang: languageDirection.split("-")[1],
      };

      const res = await fetch(`${apiUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Handle response errors
      let errorMessage = "Failed to generate flashcard";
      if (res.status === 400) {
        errorMessage = "Invalid request. Please check your input.";
      } else if (res.status === 429) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (res.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      if (!res.ok) {
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

  // Save flashcard
  const handleSave = async () => {
    if (!previewFlashcard) return;

    try {
      setIsLoading(true);
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      // Prepare flashcard data with folder
      const flashcardToSave = {
        ...previewFlashcard,
        folder_id: selectedFolderId === "none" ? null : selectedFolderId,
      };

      // Send to backend
      const res = await fetch(`${apiUrl}/flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flashcardToSave),
      });

      if (!res.ok) {
        throw new Error(`Failed to save flashcard: ${res.status}`);
      }

      // Success
      toast.success("Flashcard saved successfully");

      // Clear form and preview
      setText("");
      setPreviewFlashcard(null);

      // Reset manual form
      setManualForm({
        word: "",
        translation: "",
        phonetic: "",
        pos: "",
        example: "",
        notes: "",
      });

      // Notify parent of success
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Failed to save flashcard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setPreviewFlashcard(null);
    setError(null);
    setText("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) handleGenerate();
  };

  // Handle edits to the preview card
  const updatePreview = (field: string, value: string) => {
    if (!previewFlashcard) return;
    setPreviewFlashcard({
      ...previewFlashcard,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to flashcards
        </button>
      )}

      <div>
        <h1 className="text-xl font-bold sm:text-2xl mb-4">Create Flashcard</h1>

        <Tabs defaultValue="generator">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="generator">Generate with AI</TabsTrigger>
            <TabsTrigger value="manual">Create Manually</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Flashcard Generator
                </CardTitle>
                <CardDescription>
                  Enter a word or short phrase to generate a language learning
                  flashcard
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
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

                  <div className="flex gap-2">
                    <Select
                      value={languageDirection}
                      onValueChange={(val) => setLanguageDirection(val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Translate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto-zh">Auto → Mandarin</SelectItem>
                        <SelectItem value="auto-fr">Auto → French</SelectItem>
                        <SelectItem value="auto-en">Auto → English</SelectItem>
                        <SelectItem value="en-zh">
                          English → Mandarin
                        </SelectItem>
                        <SelectItem value="zh-en">
                          Mandarin → English
                        </SelectItem>
                        <SelectItem value="en-fr">English → French</SelectItem>
                        <SelectItem value="fr-en">French → English</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="gap-1 whitespace-nowrap"
                    >
                      {isLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {isLoading ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </div>

                {inputError && (
                  <p className="text-xs text-red-500">{inputError}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  Create Flashcard Manually
                </CardTitle>
                <CardDescription>
                  Add your own flashcard with custom content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manual-word">Word/Phrase</Label>
                    <Input
                      id="manual-word"
                      placeholder="Enter word or phrase"
                      value={manualForm.word}
                      onChange={(e) =>
                        handleManualChange("word", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="manual-translation">Translation</Label>
                    <Input
                      id="manual-translation"
                      placeholder="Enter translation"
                      value={manualForm.translation}
                      onChange={(e) =>
                        handleManualChange("translation", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="grid gap-2 flex-1">
                      <Label htmlFor="manual-phonetic">Pronunciation</Label>
                      <Input
                        id="manual-phonetic"
                        placeholder="Phonetic (optional)"
                        value={manualForm.phonetic}
                        onChange={(e) =>
                          handleManualChange("phonetic", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2 flex-1">
                      <Label htmlFor="manual-pos">Part of Speech</Label>
                      <Select
                        value={manualForm.pos}
                        onValueChange={(val) => handleManualChange("pos", val)}
                      >
                        <SelectTrigger id="manual-pos">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOUN">Noun</SelectItem>
                          <SelectItem value="VERB">Verb</SelectItem>
                          <SelectItem value="ADJ">Adjective</SelectItem>
                          <SelectItem value="ADV">Adverb</SelectItem>
                          <SelectItem value="PRON">Pronoun</SelectItem>
                          <SelectItem value="PREP">Preposition</SelectItem>
                          <SelectItem value="CONJ">Conjunction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="manual-example">Example Sentence</Label>
                    <textarea
                      id="manual-example"
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Example sentence using this word"
                      value={manualForm.example}
                      onChange={(e) =>
                        handleManualChange("example", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="manual-notes">Notes (Optional)</Label>
                    <textarea
                      id="manual-notes"
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Any additional notes about this word"
                      value={manualForm.notes}
                      onChange={(e) =>
                        handleManualChange("notes", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Translation Direction</Label>
                    <Select
                      value={languageDirection}
                      onValueChange={(val) => setLanguageDirection(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-zh">
                          English → Mandarin
                        </SelectItem>
                        <SelectItem value="zh-en">
                          Mandarin → English
                        </SelectItem>
                        <SelectItem value="en-fr">English → French</SelectItem>
                        <SelectItem value="fr-en">French → English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={handleCreateManual}>
                    <Save className="mr-2 h-4 w-4" /> Preview Flashcard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
            <CardFooter>
              <Button onClick={handleSave} className="w-full">
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Flashcard
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && !previewFlashcard && (
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

        {/* Empty state - only show if no errors or loading */}
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
    </div>
  );
}
