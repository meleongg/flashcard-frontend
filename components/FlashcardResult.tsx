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
import { FlashcardData } from "@/types/flashcard";
import {
  Bookmark,
  CheckCircle,
  Copy,
  Edit,
  Loader,
  Share,
  Trash2,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

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

// Extended props type
interface FlashcardResultProps extends FlashcardData {
  id?: string;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (id: string, data: Partial<FlashcardData>) => Promise<void>;
}

export const FlashcardResult: React.FC<FlashcardResultProps> = ({
  id,
  word,
  translation,
  phonetic,
  pos,
  example,
  notes,
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
  });

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setEditForm((prev) => ({
      ...prev,
      pos: value,
    }));
  };

  const handleEditSubmit = async () => {
    if (!id || !onEdit) return;

    setIsEditing(true);
    try {
      await onEdit(id, editForm);
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
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="pb-2">
                  <DialogTitle>Edit flashcard</DialogTitle>
                  <DialogDescription>
                    Make changes to your flashcard below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="word">Word</Label>
                    <Input
                      id="word"
                      name="word"
                      value={editForm.word}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="translation">Translation</Label>
                    <Input
                      id="translation"
                      name="translation"
                      value={editForm.translation}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phonetic">Phonetic</Label>
                    <Input
                      id="phonetic"
                      name="phonetic"
                      value={editForm.phonetic}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pos">Part of Speech</Label>
                    <Select
                      value={editForm.pos}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select part of speech" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(posDescriptions).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="example">Example</Label>
                    <Textarea
                      id="example"
                      name="example"
                      value={editForm.example}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={editForm.notes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="pt-2">
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
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete flashcard</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the flashcard for{" "}
                    <span className="font-semibold">"{word}"</span>? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
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
