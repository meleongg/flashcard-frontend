"use client";

import { FlashcardResult } from "@/components/FlashcardResult";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/context/app-context"; // Add this import
import { apiUrl } from "@/lib/constants";
import { FlashcardData, FlashcardResponse } from "@/types/flashcard";
import { Folder as FlashcardFolder } from "@/types/folder";
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  Grid,
  List,
  Loader,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const pageSize = 5;

export function FlashcardsClient({ session }: { session: Session }) {
  // Get shared state from context
  const {
    selectedFolderId,
    setSelectedFolderId,
    addRecentFolder,
    viewMode,
    setViewMode,
    flashcardsVersion, // Use to trigger refetches
  } = useAppContext();

  // Keep local state for things not shared across pages
  const [page, setPage] = useState(0);
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<FlashcardResponse[]>([]);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

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
    }
  };

  const fetchFlashcards = async (currentPage = 0) => {
    setIsLoadingCards(true);

    try {
      const session = await getSession();
      const token = session?.accessToken;

      const url = new URL(`${apiUrl}/flashcards`);
      url.searchParams.append("skip", (currentPage * pageSize).toString());
      url.searchParams.append("limit", pageSize.toString());

      if (selectedFolderId !== "all") {
        url.searchParams.append("folder_id", selectedFolderId);

        // Add current folder to recent folders list when viewing it
        const currentFolder = folders.find((f) => f.id === selectedFolderId);
        if (currentFolder) {
          addRecentFolder(currentFolder);
        }
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch flashcards: ${res.status}`);

      const data = await res.json();

      setAllFlashcards(data.flashcards);
      setTotalFlashcards(data.total);
    } catch (err) {
      console.error("Error fetching flashcards:", err);
      toast.error("Failed to load flashcards");
    } finally {
      setIsLoadingCards(false);
    }
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

  // Fetch functions with updated dependencies
  useEffect(() => {
    fetchFolders();
  }, [session]);

  useEffect(() => {
    fetchFlashcards(page);
    // Added flashcardsVersion as dependency to trigger refetch when other pages update cards
  }, [page, selectedFolderId, flashcardsVersion]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Your Flashcards</h1>

        {/* Folder selector using context state */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Viewing:</span>
          </div>
          <Select
            value={selectedFolderId}
            onValueChange={(value) => {
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

        {/* View mode toggle buttons */}
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

        <p className="text-sm text-muted-foreground sm:ml-auto">
          {totalFlashcards > 0 && (
            <>
              Showing {page * pageSize + 1}-
              {Math.min((page + 1) * pageSize, totalFlashcards)} of{" "}
              {totalFlashcards}
            </>
          )}
        </p>
      </div>

      {/* Flashcards in either grid or list view based on viewMode */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
            : "space-y-4"
        }
      >
        {isLoadingCards ? (
          <div className="flex justify-center py-8 col-span-full">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : allFlashcards.length > 0 ? (
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
                folderName={folders.find((f) => f.id === fc.folder_id)?.name}
                folders={folders}
                sourceLang={fc.source_lang}
                targetLang={fc.target_lang}
                onDelete={deleteFlashcard}
                onEdit={editFlashcard}
                viewMode={viewMode}
              />
            ))}

            {/* Pagination */}
            <div
              className={`flex justify-center items-center gap-4 pt-4 ${
                viewMode === "grid" ? "col-span-full" : ""
              }`}
            >
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
                  (page + 1) * pageSize >= totalFlashcards || isLoadingCards
                }
                className="cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <div
            className={`flex flex-col items-center justify-center py-8 text-center ${
              viewMode === "grid" ? "col-span-full" : ""
            }`}
          >
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
      </div>
    </div>
  );
}
