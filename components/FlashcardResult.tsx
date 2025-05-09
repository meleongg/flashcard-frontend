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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}) => {
  const [saved, setSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <Card className="overflow-hidden border-2 border-primary/10">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Language Flashcard</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={`${
                    posColors[pos] || "bg-gray-100 text-gray-800"
                  } cursor-pointer`}
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

      <CardContent className="pt-6 pb-2">
        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="study" className="cursor-pointer">
              Study
            </TabsTrigger>
            <TabsTrigger value="details" className="cursor-pointer">
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 pb-2 border-b">
              <div>
                <h2 className="text-3xl font-bold">{word}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg text-muted-foreground">
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
                <div className="text-sm italic text-muted-foreground">
                  {phonetic}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Example
              </h3>
              <p className="text-lg p-3 bg-muted rounded-md">{example}</p>
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

      <CardFooter className="flex justify-between pt-2 pb-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="cursor-pointer"
          >
            <Share className="h-4 w-4 mr-1" /> Share
          </Button>
          {id && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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
          className="cursor-pointer"
        >
          {saved ? (
            <CheckCircle className="h-4 w-4 mr-1" />
          ) : (
            <Bookmark className="h-4 w-4 mr-1" />
          )}
          {saved ? "Saved" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
};
