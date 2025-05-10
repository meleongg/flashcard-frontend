"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getLanguageName,
  posColors,
  posDescriptions,
} from "@/lib/language-helpers";
import { cn } from "@/lib/utils";
import { FlashcardData } from "@/types/flashcard";
import {
  Copy,
  Edit,
  ExternalLink,
  Folder,
  Loader,
  Trash2,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface FlashcardResultProps extends FlashcardData {
  id?: string;
  folderId?: string;
  folderName?: string;
  folders?: Array<{ id: string; name: string }>;
  sourceLang?: string;
  targetLang?: string;
  viewMode?: "grid" | "list"; // Add this line
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (
    id: string,
    data: Partial<FlashcardData & { folder_id?: string }>
  ) => Promise<void>;
}

// Create a validation schema using zod
const flashcardSchema = z.object({
  word: z
    .string()
    .min(1, "Word is required")
    .max(50, "Word is too long (max 50 characters)"),
  translation: z
    .string()
    .min(1, "Translation is required")
    .max(100, "Translation is too long"),
  phonetic: z.string().max(50, "Phonetic text is too long"),
  pos: z.string().min(1, "Part of speech is required"),
  example: z.string().max(500, "Example is too long"),
  notes: z.string().max(500, "Notes are too long"),
});

type FlashcardField = keyof z.infer<typeof flashcardSchema>;

export const FlashcardResult: React.FC<FlashcardResultProps> = ({
  id,
  word,
  translation,
  phonetic,
  pos,
  example,
  notes,
  folderId,
  folderName,
  folders = [],
  sourceLang,
  targetLang,
  viewMode = "list", // Add default value
  onDelete,
  onEdit,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State for edit form
  const [editForm, setEditForm] = useState({
    word,
    translation,
    phonetic,
    pos,
    example,
    notes,
    folder_id: folderId || "none",
    source_lang: sourceLang || "",
    target_lang: targetLang || "",
  });

  const [formErrors, setFormErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  const copyToClipboard = () => {
    const content = `
      Word: ${word}
      Translation: ${translation}
      Pronunciation: ${phonetic}
      Part of Speech: ${posDescriptions[pos] || pos}
      Example: ${example}
      Notes: ${notes}
    `.trim();
    navigator.clipboard.writeText(content);
    toast.success("Copied flashcard content to clipboard");
  };

  const validateField = (name: FlashcardField, value: string) => {
    try {
      flashcardSchema.shape[name].parse(value);
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || `Invalid ${name}`;
        setFormErrors((prev) => ({
          ...prev,
          [name]: message,
        }));
        return false;
      }
      return true;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Type assertion to tell TypeScript that name is a valid field
    validateField(name as FlashcardField, value);
  };

  const playPronunciation = () => {
    // Check if browser supports speech synthesis
    if (!("speechSynthesis" in window)) {
      toast.error("Your browser doesn't support text to speech");
      return;
    }

    setIsSpeaking(true);

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(word);

    // Add event listeners to track when speech has finished
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("Failed to play pronunciation");
    };

    // Set the language based on the flashcard's source language
    if (sourceLang) {
      // Map language code to BCP-47 language tag format required by SpeechSynthesis
      const langMap: Record<string, string> = {
        en: "en-US",
        zh: "zh-CN",
        es: "es-ES",
        fr: "fr-FR",
        ja: "ja-JP",
        de: "de-DE",
        ru: "ru-RU",
        it: "it-IT",
        pt: "pt-PT",
        ko: "ko-KR",
      };

      utterance.lang = langMap[sourceLang] || sourceLang;
    }

    // Optional: Set other properties
    utterance.rate = 0.9; // Slightly slower than default
    utterance.volume = 1.0;

    // Play the speech
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);

    // Show toast message
    toast.info(`Playing "${word}" in ${getLanguageName(sourceLang || "en")}`);
  };

  const playTranslation = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Your browser doesn't support text to speech");
      return;
    }

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(translation);

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("Failed to play pronunciation");
    };

    // Use target language for the translation
    if (targetLang) {
      const langMap: Record<string, string> = {
        en: "en-US",
        zh: "zh-CN",
        es: "es-ES",
        fr: "fr-FR",
        ja: "ja-JP",
        de: "de-DE",
        ru: "ru-RU",
        it: "it-IT",
        pt: "pt-PT",
        ko: "ko-KR",
      };

      utterance.lang = langMap[targetLang] || targetLang;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    toast.info(`Playing translation in ${getLanguageName(targetLang || "en")}`);
  };

  const handleDelete = async () => {
    if (!id || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
      // Toast is handled in parent component
    } catch (err) {
      // If there's an error that wasn't caught by parent
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectChange = (value: string) => {
    setEditForm((prev) => ({
      ...prev,
      pos: value,
    }));
    validateField("pos", value);
  };

  const handleEditSubmit = async () => {
    if (!id || !onEdit) return;

    // Validate all fields
    try {
      flashcardSchema.parse(editForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(newErrors);
        toast.error("Please fix the errors in the form");
        return;
      }
    }

    setIsEditing(true);
    try {
      // Make a copy of editForm to modify for submission
      const dataToSubmit = { ...editForm };

      // Convert "none" to empty string for the API
      if (dataToSubmit.folder_id === "none") {
        dataToSubmit.folder_id = "";
      }

      await onEdit(id, dataToSubmit);
      toast.success("Flashcard updated successfully");
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Failed to update flashcard");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-primary/10",
        // Add responsive styling for grid mode
        viewMode === "grid" && "h-full flex flex-col"
      )}
    >
      <CardHeader
        className={cn(
          "bg-primary/5 px-4 py-3 sm:px-6 sm:py-4",
          // Make header more compact in grid view
          viewMode === "grid" && "px-3 py-2 sm:px-4 sm:py-3"
        )}
      >
        <div className="flex items-center justify-between">
          <CardTitle
            className={cn(
              "text-lg sm:text-xl",
              viewMode === "grid" && "text-base sm:text-lg"
            )}
          >
            {/* Shorten title in grid mode */}
            {viewMode === "grid" ? word : "Language Flashcard"}

            {sourceLang && targetLang && viewMode !== "grid" && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {getLanguageName(sourceLang)} → {getLanguageName(targetLang)}
              </span>
            )}
          </CardTitle>

          {/* Badges section */}
          <div className="flex items-center gap-2">
            {/* Show fewer elements in grid view */}
            {folderName && (viewMode === "list" || folders?.length === 1) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-blue-50 text-blue-600 cursor-pointer text-xs">
                      <Folder className="h-3 w-3 mr-1" /> {folderName}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Folder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={`${
                      posColors[pos] || "bg-gray-100 text-gray-800"
                    } cursor-pointer text-xs sm:text-sm`}
                  >
                    {posDescriptions[pos] || pos}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Part of Speech</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "pt-4 pb-2 px-4 sm:pt-6 sm:px-6",
          viewMode === "grid" && "px-3 py-2 sm:px-4 sm:pt-3 flex-1"
        )}
      >
        {/* In grid view, show simplified content */}
        {viewMode === "grid" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold truncate">{word}</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={playPronunciation}
                disabled={isSpeaking}
                className="h-6 w-6 rounded-full cursor-pointer ml-auto"
              >
                {isSpeaking ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm sm:text-base text-muted-foreground truncate">
                {translation}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={playTranslation}
                disabled={isSpeaking}
                className="h-6 w-6 rounded-full cursor-pointer"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>

            {phonetic && (
              <div className="text-xs italic text-muted-foreground truncate">
                {phonetic}
              </div>
            )}

            {/* Language tag in grid mode */}
            {sourceLang && targetLang && (
              <div className="text-xs text-muted-foreground mt-auto pt-2">
                {getLanguageName(sourceLang)} → {getLanguageName(targetLang)}
              </div>
            )}
          </div>
        ) : (
          // Original tabs content for list view
          <Tabs defaultValue="study" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 w-full">
              <TabsTrigger
                value="study"
                className="cursor-pointer text-xs sm:text-sm"
              >
                Study
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="cursor-pointer text-xs sm:text-sm"
              >
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="study" className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-2 pb-2 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-3xl font-bold">{word}</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={playPronunciation}
                            disabled={isSpeaking}
                            className="h-6 w-6 rounded-full cursor-pointer"
                          >
                            {isSpeaking ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Play {getLanguageName(sourceLang || "en")}{" "}
                            pronunciation
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base sm:text-lg text-muted-foreground">
                      {translation}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={playTranslation}
                            disabled={isSpeaking}
                            className="h-6 w-6 rounded-full cursor-pointer"
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Play {getLanguageName(targetLang || "en")}{" "}
                            translation
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="text-xs sm:text-sm italic text-muted-foreground">
                    {phonetic}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Example
                </h3>
                <p className="text-base sm:text-lg p-2 sm:p-3 bg-muted rounded-md">
                  {example}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Notes
                </h3>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-base">{notes || "No notes added"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Flashcard Details
                </h3>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {/* Language Direction */}
                  {sourceLang && targetLang && (
                    <div className="col-span-2 flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <span className="font-medium">Languages:</span>
                      <span>
                        {getLanguageName(sourceLang)} →{" "}
                        {getLanguageName(targetLang)}
                      </span>
                    </div>
                  )}

                  {/* Part of Speech with description */}
                  <div className="flex flex-col p-2 bg-muted/50 rounded">
                    <span className="text-xs text-muted-foreground">
                      Part of Speech
                    </span>
                    <span className="font-medium">
                      {posDescriptions[pos] || pos}
                    </span>
                  </div>

                  {/* Folder information */}
                  <div className="flex flex-col p-2 bg-muted/50 rounded">
                    <span className="text-xs text-muted-foreground">
                      Folder
                    </span>
                    <span className="font-medium">
                      {folderName || "Not categorized"}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between pt-2 pb-3 px-4 sm:px-6 sm:pb-4",
          viewMode === "grid" && "px-3 py-2 sm:px-4 sm:py-3 border-t"
        )}
      >
        {/* In grid view, show fewer buttons */}
        {viewMode === "grid" ? (
          <div className="flex justify-between w-full">
            {id && (
              <Link href={`/flashcards/${id}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-8 cursor-pointer text-xs"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              className="p-1 h-8 cursor-pointer text-xs"
            >
              <Copy className="h-4 w-4" />
            </Button>

            {id && onEdit && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 h-8 cursor-pointer text-blue-500"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                {/* Original dialog content */}
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0">
                  {/* Dialog header now sticky at top */}
                  <DialogHeader className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2">
                    <DialogTitle>Edit flashcard</DialogTitle>
                    <DialogDescription>
                      Make changes to your flashcard below.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="word">
                          Word{" "}
                          {formErrors.word && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="word"
                          name="word"
                          value={editForm.word}
                          onChange={handleInputChange}
                          className={cn(
                            formErrors.word &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.word && (
                          <p className="text-xs text-red-500">
                            {formErrors.word}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="translation">
                          Translation{" "}
                          {formErrors.translation && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="translation"
                          name="translation"
                          value={editForm.translation}
                          onChange={handleInputChange}
                          className={cn(
                            formErrors.translation &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.translation && (
                          <p className="text-xs text-red-500">
                            {formErrors.translation}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phonetic">
                          Phonetic{" "}
                          {formErrors.phonetic && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="phonetic"
                          name="phonetic"
                          value={editForm.phonetic}
                          onChange={handleInputChange}
                          className={cn(
                            formErrors.phonetic &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.phonetic && (
                          <p className="text-xs text-red-500">
                            {formErrors.phonetic}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pos">
                          Part of Speech{" "}
                          {formErrors.pos && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Select
                          value={editForm.pos}
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-full",
                              formErrors.pos &&
                                "border-red-500 focus-visible:ring-red-500"
                            )}
                          >
                            <SelectValue placeholder="Select part of speech" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(posDescriptions).map(
                              ([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.pos && (
                          <p className="text-xs text-red-500">
                            {formErrors.pos}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="example">
                          Example{" "}
                          {formErrors.example && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Textarea
                          id="example"
                          name="example"
                          value={editForm.example}
                          onChange={handleInputChange}
                          rows={3}
                          className={cn(
                            formErrors.example &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.example && (
                          <p className="text-xs text-red-500">
                            {formErrors.example}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">
                          Notes{" "}
                          {formErrors.notes && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={editForm.notes}
                          onChange={handleInputChange}
                          rows={3}
                          className={cn(
                            formErrors.notes &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.notes && (
                          <p className="text-xs text-red-500">
                            {formErrors.notes}
                          </p>
                        )}
                      </div>
                      {/* Add this field to the edit dialog form */}
                      <div className="grid gap-2">
                        <Label htmlFor="folder">Folder</Label>
                        <Select
                          value={editForm.folder_id || "none"}
                          onValueChange={(value) => {
                            setEditForm((prev) => ({
                              ...prev,
                              folder_id: value === "none" ? "" : value,
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select folder" />
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
                        <p className="text-xs text-muted-foreground">
                          Organize your flashcard by assigning it to a folder
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sticky footer at bottom */}
                  <DialogFooter className="sticky bottom-0 z-10 bg-background px-4 py-3 border-t">
                    <Button
                      type="submit"
                      onClick={handleEditSubmit}
                      disabled={isEditing}
                      className="w-full sm:w-auto"
                    >
                      {isEditing ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-1" />
                          Saving...
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {id && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 h-8 cursor-pointer text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                {/* Original alert dialog content */}
                <AlertDialogContent className="max-w-[90vw] sm:max-w-md flex flex-col p-0">
                  <AlertDialogHeader className="px-4 pt-4 pb-2">
                    <AlertDialogTitle>Delete flashcard</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the flashcard for{" "}
                      <span className="font-semibold">"{word}"</span>? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="sticky bottom-0 z-10 bg-background px-4 py-3 border-t">
                    <AlertDialogCancel className="cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600 focus:ring-red-500 cursor-pointer"
                    >
                      {isDeleting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-1" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ) : (
          // Original footer for list view
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start">
            {id && (
              <Link href={`/flashcards/${id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer text-primary text-xs"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> View
                  Details
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="cursor-pointer text-xs"
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Copy
            </Button>

            {/* Edit Button and Dialog */}
            {id && onEdit && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer text-blue-500 hover:text-blue-700 hover:bg-blue-50 text-xs"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0">
                  <DialogHeader className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2">
                    <DialogTitle>Edit flashcard</DialogTitle>
                    <DialogDescription>
                      Make changes to your flashcard below.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="word">
                          Word{" "}
                          {formErrors.word && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="word"
                          name="word"
                          value={editForm.word}
                          onChange={handleInputChange}
                          className={cn(
                            formErrors.word &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.word && (
                          <p className="text-xs text-red-500">
                            {formErrors.word}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="translation">
                          Translation{" "}
                          {formErrors.translation && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="translation"
                          name="translation"
                          value={editForm.translation}
                          onChange={handleInputChange}
                          className={cn(
                            formErrors.translation &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.translation && (
                          <p className="text-xs text-red-500">
                            {formErrors.translation}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phonetic">
                          Phonetic{" "}
                          {formErrors.phonetic && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          id="phonetic"
                          name="phonetic"
                          value={editForm.phonetic}
                          onChange={handleInputChange}
                          className={cn(
                            formErrors.phonetic &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.phonetic && (
                          <p className="text-xs text-red-500">
                            {formErrors.phonetic}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pos">
                          Part of Speech{" "}
                          {formErrors.pos && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Select
                          value={editForm.pos}
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-full",
                              formErrors.pos &&
                                "border-red-500 focus-visible:ring-red-500"
                            )}
                          >
                            <SelectValue placeholder="Select part of speech" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(posDescriptions).map(
                              ([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.pos && (
                          <p className="text-xs text-red-500">
                            {formErrors.pos}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="example">
                          Example{" "}
                          {formErrors.example && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Textarea
                          id="example"
                          name="example"
                          value={editForm.example}
                          onChange={handleInputChange}
                          rows={3}
                          className={cn(
                            formErrors.example &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.example && (
                          <p className="text-xs text-red-500">
                            {formErrors.example}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">
                          Notes{" "}
                          {formErrors.notes && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={editForm.notes}
                          onChange={handleInputChange}
                          rows={3}
                          className={cn(
                            formErrors.notes &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {formErrors.notes && (
                          <p className="text-xs text-red-500">
                            {formErrors.notes}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="folder">Folder</Label>
                        <Select
                          value={editForm.folder_id || "none"}
                          onValueChange={(value) => {
                            setEditForm((prev) => ({
                              ...prev,
                              folder_id: value === "none" ? "" : value,
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select folder" />
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
                        <p className="text-xs text-muted-foreground">
                          Organize your flashcard by assigning it to a folder
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="sticky bottom-0 z-10 bg-background px-4 py-3 border-t">
                    <Button
                      type="submit"
                      onClick={handleEditSubmit}
                      disabled={isEditing}
                      className="w-full sm:w-auto"
                    >
                      {isEditing ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-1" />
                          Saving...
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {id && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-md flex flex-col p-0">
                  <AlertDialogHeader className="px-4 pt-4 pb-2">
                    <AlertDialogTitle>Delete flashcard</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the flashcard for{" "}
                      <span className="font-semibold">"{word}"</span>? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="sticky bottom-0 z-10 bg-background px-4 py-3 border-t">
                    <AlertDialogCancel className="cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600 focus:ring-red-500 cursor-pointer"
                    >
                      {isDeleting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-1" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
