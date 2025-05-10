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
import { cn } from "@/lib/utils";
import { FlashcardData } from "@/types/flashcard";
import {
  Bookmark,
  CheckCircle,
  Copy,
  Edit,
  Folder,
  Loader,
  Share,
  Trash2,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod"; // You'll need to install zod: npm install zod

// Map of POS tags to more readable descriptions
const posDescriptions: Record<string, string> = {
  NOUN: "Noun",
  VERB: "Verb",
  ADJ: "Adjective",
  ADV: "Adverb",
  ADP: "Preposition",
  CONJ: "Conjunction",
  DET: "Determiner",
  PRON: "Pronoun",
  PROPN: "Proper noun",
  NUM: "Number",
  PART: "Particle",
  INTJ: "Interjection",
  PUNCT: "Punctuation",
  SYM: "Symbol",
  X: "Other",
};

// Map of POS tags to colors
const posColors: Record<string, string> = {
  NOUN: "bg-blue-100 text-blue-800",
  VERB: "bg-green-100 text-green-800",
  ADJ: "bg-purple-100 text-purple-800",
  ADV: "bg-amber-100 text-amber-800",
  PRON: "bg-pink-100 text-pink-800",
  PROPN: "bg-indigo-100 text-indigo-800",
};

interface FlashcardResultProps extends FlashcardData {
  id?: string;
  folderId?: string;
  folderName?: string;
  folders?: Array<{ id: string; name: string }>;
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
  onDelete,
  onEdit,
}) => {
  const [saved, setSaved] = useState(false);
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
  });

  const [formErrors, setFormErrors] = useState<
    Record<string, string | undefined>
  >({});

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

  const handleSave = () => {
    setSaved(true);
    toast.success("Flashcard saved to your collection");
  };

  const handleShare = () => {
    toast.success("Share dialog opened");
  };

  const playPronunciation = () => {
    toast.info("Playing pronunciation...");
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
    <Card className="overflow-hidden border-2 border-primary/10">
      <CardHeader className="bg-primary/5 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">
            Language Flashcard
          </CardTitle>
          <div className="flex items-center gap-2">
            {folderName && (
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

      <CardContent className="pt-4 pb-2 px-4 sm:pt-6 sm:px-6">
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
                <h2 className="text-xl sm:text-3xl font-bold">{word}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base sm:text-lg text-muted-foreground">
                    {translation}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={playPronunciation}
                    className="h-6 w-6 rounded-full cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
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
                <p className="text-base">{notes}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Additional Information
              </h3>
              <p className="text-sm text-muted-foreground">
                Create your own flashcards by entering different words or
                phrases above.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between pt-2 pb-3 px-4 sm:px-6 sm:pb-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="cursor-pointer text-xs"
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="cursor-pointer text-xs"
          >
            <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Share
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
                        <p className="text-xs text-red-500">{formErrors.pos}</p>
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

          {/* Delete Button */}
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
                    <span className="font-semibold">"{word}"</span>? This action
                    cannot be undone.
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

        <Button
          size="sm"
          variant={saved ? "default" : "secondary"}
          onClick={handleSave}
          disabled={saved}
          className="cursor-pointer text-xs w-full sm:w-auto mt-2 sm:mt-0"
        >
          {saved ? (
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          ) : (
            <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          )}
          {saved ? "Saved" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
};
