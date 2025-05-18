"use client";

import { FlashcardCreator } from "@/components/FlashcardCreator";
import { FlashcardResult } from "@/components/FlashcardResult";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/app-context";
import { apiUrl } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FlashcardData, FlashcardResponse } from "@/types/flashcard";
import { Folder as FlashcardFolder } from "@/types/folder";
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  Grid,
  List,
  Loader,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const pageSize = 10;

export function FlashcardsClient({ session }: { session: Session }) {
  const {
    selectedFolderId,
    setSelectedFolderId,
    addRecentFolder,
    recentFolders,
    viewMode,
    setViewMode,
    flashcardsVersion,
  } = useAppContext();

  const [page, setPage] = useState(0);
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<FlashcardResponse[]>([]);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  const recentFolderIds = new Set(recentFolders.map((f) => f.id));
  const nonRecentFolders = folders.filter((f) => !recentFolderIds.has(f.id));

  // Original fetch functions remain the same
  const fetchFolders = async () => {
    // Same implementation as before
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
    // Same implementation as before
    setIsLoadingCards(true);

    try {
      const session = await getSession();
      const token = session?.accessToken;

      const url = new URL(`${apiUrl}/flashcards`);
      url.searchParams.append("skip", (currentPage * pageSize).toString());
      url.searchParams.append("limit", pageSize.toString());

      if (selectedFolderId !== "all") {
        url.searchParams.append("folder_id", selectedFolderId);

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
    // Same implementation
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
    // Same implementation
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

      await fetchFlashcards(page);
      toast.success("Flashcard updated successfully");
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to update flashcard");
      throw error;
    }
  };

  // Effects stay the same
  useEffect(() => {
    fetchFolders();
  }, [session]);

  useEffect(() => {
    fetchFlashcards(page);
  }, [page, selectedFolderId, flashcardsVersion]);

  // Handle route parameters
  useEffect(() => {
    // Check URL parameters for create=true
    const urlParams = new URLSearchParams(window.location.search);
    const shouldCreateNew = urlParams.get("create") === "true";
    const prefilledText = urlParams.get("text") || "";

    if (shouldCreateNew) {
      setActiveTab("create");

      // If text parameter exists, set it in the creator
      if (prefilledText) {
        // You may want to pass this down to FlashcardCreator
        // through a prop like initialWord
      }
    }
  }, []);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalFlashcards / pageSize);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
          </TabsList>

          {/* Only show view controls in browse tab */}
          {activeTab === "browse" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 px-2 sm:px-3",
                    viewMode === "list" && "bg-muted"
                  )}
                >
                  <List className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">List</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 px-2 sm:px-3",
                    viewMode === "grid" && "bg-muted"
                  )}
                >
                  <Grid className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Grid</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Browse Tab Content */}
        <TabsContent value="browse" className="mt-6">
          {/* Folder filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold sm:text-2xl">Your Flashcards</h1>

              {/* Mobile filters button */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="lg:hidden">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem className="flex flex-col items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-full">
                        Folder
                      </span>
                      <Select
                        value={selectedFolderId}
                        onValueChange={(value) => {
                          setSelectedFolderId(value);
                          setPage(0);
                        }}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="Select folder" />
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
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Desktop folder filters */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Folder:</span>
                </div>
                <Select
                  value={selectedFolderId}
                  onValueChange={(value) => {
                    setSelectedFolderId(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flashcards</SelectItem>
                    {recentFolders.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Recent Folders</SelectLabel>
                        {recentFolders.map((folder) => (
                          <SelectItem
                            key={`recent-${folder.id}`}
                            value={folder.id}
                          >
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {nonRecentFolders.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>All Folders</SelectLabel>
                        {nonRecentFolders.map((folder) => (
                          <SelectItem
                            key={`all-${folder.id}`}
                            value={folder.id}
                          >
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                {totalFlashcards > 0 && (
                  <>
                    Showing {page * pageSize + 1}-
                    {Math.min((page + 1) * pageSize, totalFlashcards)} of{" "}
                    {totalFlashcards}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Flashcards display */}
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}
          >
            {/* Loading, empty, and flashcards display logic */}
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
                    folderName={
                      folders.find((f) => f.id === fc.folder_id)?.name
                    }
                    folders={folders}
                    source_lang={fc.source_lang}
                    target_lang={fc.target_lang}
                    onDelete={deleteFlashcard}
                    onEdit={editFlashcard}
                    viewMode={viewMode}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className={cn(
                      "flex justify-center items-center gap-3 pt-6",
                      viewMode === "grid" && "col-span-full"
                    )}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0 || isLoadingCards}
                      className="h-8 px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Previous</span>
                    </Button>

                    <span className="text-sm">
                      <span className="hidden sm:inline">Page </span>
                      {page + 1} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={
                        (page + 1) * pageSize >= totalFlashcards ||
                        isLoadingCards
                      }
                      className="h-8 px-2 sm:px-3"
                    >
                      <span className="mr-1 hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-8 text-center",
                  viewMode === "grid" && "col-span-full"
                )}
              >
                <div className="bg-muted/20 p-6 rounded-lg max-w-md">
                  <p className="font-medium mb-2">No flashcards found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedFolderId !== "all"
                      ? "This folder doesn't contain any flashcards yet."
                      : "You haven't created any flashcards yet."}
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" /> Create New Flashcard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create Tab Content */}
        <TabsContent value="create" className="mt-6">
          <FlashcardCreator
            session={session}
            folders={folders}
            onSaveSuccess={() => {
              fetchFlashcards();
              setActiveTab("browse");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Mobile FAB for quick creation */}
      {activeTab === "browse" && allFlashcards.length > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button
            onClick={() => setActiveTab("create")}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
