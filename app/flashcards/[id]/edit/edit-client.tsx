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
import { getLanguageName } from "@/lib/language-helpers";
import { FlashcardData } from "@/types/flashcard";
import { ArrowLeft, Loader, Save } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function EditFlashcardClient({
  id,
  session,
}: {
  id: string;
  session: Session;
}) {
  const { refreshFlashcards } = useAppContext();
  const router = useRouter();

  const [flashcard, setFlashcard] = useState<FlashcardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  // Fetch the flashcard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        const token = session?.accessToken;

        // Fetch folders
        const foldersRes = await fetch(`${apiUrl}/folders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (foldersRes.ok) {
          const foldersData = await foldersRes.json();
          setFolders(foldersData);
        }

        // Fetch flashcard
        const flashcardRes = await fetch(`${apiUrl}/flashcard/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!flashcardRes.ok) {
          if (flashcardRes.status === 404) {
            toast.error("Flashcard not found");
            router.push("/flashcards");
            return;
          }
          throw new Error("Failed to fetch flashcard");
        }

        const data = await flashcardRes.json();
        setFlashcard(data);
        setSelectedFolder(data.folder_id || "none");
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleInputChange = (field: keyof FlashcardData, value: string) => {
    if (flashcard) {
      setFlashcard({ ...flashcard, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcard) return;

    setSubmitting(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const payload = {
        ...flashcard,
        folder_id: selectedFolder === "none" ? "" : selectedFolder,
      };

      const res = await fetch(`${apiUrl}/flashcard/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      toast.success("Flashcard updated successfully");
      refreshFlashcards(); // Update any other components
      router.push(`/flashcards/${id}`); // Return to the detail view
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update flashcard");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!flashcard) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Flashcard not found</h2>
          <Link href="/flashcards">
            <Button>Back to Flashcards</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/flashcards/${id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to flashcard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Flashcard</CardTitle>
          <CardDescription>
            Update your flashcard information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Word */}
            <div className="grid gap-2">
              <Label htmlFor="word">Word</Label>
              <Input
                id="word"
                value={flashcard.word}
                onChange={(e) => handleInputChange("word", e.target.value)}
                required
              />
            </div>

            {/* Translation */}
            <div className="grid gap-2">
              <Label htmlFor="translation">Translation</Label>
              <Input
                id="translation"
                value={flashcard.translation}
                onChange={(e) =>
                  handleInputChange("translation", e.target.value)
                }
                required
              />
            </div>

            {/* Phonetic */}
            <div className="grid gap-2">
              <Label htmlFor="phonetic">Pronunciation</Label>
              <Input
                id="phonetic"
                value={flashcard.phonetic || ""}
                onChange={(e) => handleInputChange("phonetic", e.target.value)}
              />
            </div>

            {/* Part of Speech */}
            <div className="grid gap-2">
              <Label htmlFor="pos">Part of Speech</Label>
              <Select
                value={flashcard.pos}
                onValueChange={(value) => handleInputChange("pos", value)}
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
            </div>

            {/* Example */}
            <div className="grid gap-2">
              <Label htmlFor="example">Example</Label>
              <textarea
                id="example"
                value={flashcard.example || ""}
                onChange={(e) => handleInputChange("example", e.target.value)}
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Example sentence using this word"
              ></textarea>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={flashcard.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Any additional notes about the word"
              ></textarea>
            </div>

            {/* Folder selection */}
            <div className="grid gap-2">
              <Label htmlFor="folder">Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
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
            </div>

            {/* Languages (read-only) */}
            <div className="grid gap-2">
              <Label>Languages</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {getLanguageName(flashcard.source_lang || "")} →{" "}
                {getLanguageName(flashcard.target_lang || "")}
              </div>
              <p className="text-xs text-muted-foreground">
                Language direction cannot be changed when editing
              </p>
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
