"use client";

import { FlashcardResult } from "@/components/FlashcardResult";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/app-context";
import { apiUrl } from "@/lib/constants";
import { FlashcardData, FlashcardResponse } from "@/types/flashcard";
import { ArrowLeft, FolderOpen, Grid, List, Loader } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function FolderDetailClient({
  id,
  session,
}: {
  id: string;
  session: Session;
}) {
  const { viewMode, setViewMode, flashcardsVersion, refreshFlashcards } =
    useAppContext();
  const router = useRouter();

  const [folderName, setFolderName] = useState<string>("");
  const [flashcards, setFlashcards] = useState<FlashcardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [totalCount, setTotalCount] = useState(0);

  // Fetch folder details and flashcards
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = session.accessToken;

        // Fetch folder details
        const folderRes = await fetch(`${apiUrl}/folder/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!folderRes.ok) {
          if (folderRes.status === 404) {
            toast.error("Folder not found");
            router.push("/folders");
            return;
          }
          throw new Error(`Failed to fetch folder: ${folderRes.status}`);
        }

        const folderData = await folderRes.json();
        setFolderName(folderData.name);

        // Fetch all folders (needed for edit operations)
        const foldersRes = await fetch(`${apiUrl}/folders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (foldersRes.ok) {
          const foldersData = await foldersRes.json();
          setFolders(foldersData);
        }

        // Fetch flashcards in this folder
        const flashcardsRes = await fetch(
          `${apiUrl}/flashcards?folder_id=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!flashcardsRes.ok) {
          throw new Error(
            `Failed to fetch flashcards: ${flashcardsRes.status}`
          );
        }

        const flashcardsData = await flashcardsRes.json();
        setFlashcards(flashcardsData.flashcards || []);
        setTotalCount(flashcardsData.total || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load folder data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, session, router, flashcardsVersion]);

  // Delete flashcard handler
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

      if (!res.ok) throw new Error("Failed to delete flashcard");

      // Update the UI without refetching
      setFlashcards(flashcards.filter((fc) => fc.id !== flashcardId));
      setTotalCount((prev) => prev - 1);

      refreshFlashcards(); // Signal other components to refresh
      toast.success("Flashcard deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete flashcard");
    }
  };

  // Edit flashcard handler
  const editFlashcard = async (
    flashcardId: string,
    data: Partial<FlashcardData & { folder_id?: string }>
  ) => {
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/flashcard/${flashcardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update flashcard");

      // If folder changed, we might need to remove it from the list
      if (data.folder_id && data.folder_id !== id) {
        setFlashcards(flashcards.filter((fc) => fc.id !== flashcardId));
        setTotalCount((prev) => prev - 1);
      } else {
        // Update the flashcard in the current list
        setFlashcards(
          flashcards.map((fc) =>
            fc.id === flashcardId ? { ...fc, ...data } : fc
          )
        );
      }

      refreshFlashcards(); // Signal other components to refresh
      toast.success("Flashcard updated successfully");
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to update flashcard");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/folders">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to folders
            </Button>
          </Link>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{folderName}</h1>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {totalCount} {totalCount === 1 ? "flashcard" : "flashcards"}
        </span>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
            : "space-y-4"
        }
      >
        {flashcards.length > 0 ? (
          flashcards.map((fc) => (
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
              folderName={folders.find((f) => f.id === fc.folder_id)?.name}
              folders={folders}
              source_lang={fc.source_lang}
              target_lang={fc.target_lang}
              onDelete={deleteFlashcard}
              onEdit={editFlashcard}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-muted/30 p-6 rounded-lg max-w-md">
              <p className="text-muted-foreground mb-2 font-medium">
                No flashcards in this folder
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This folder doesn't contain any flashcards yet.
              </p>
              <Link href="/flashcards">
                <Button>View All Flashcards</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
