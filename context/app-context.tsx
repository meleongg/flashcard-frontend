"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Folder } from "@/types/folder";

type AppContextType = {
  // Language preferences
  languageDirection: string;
  setLanguageDirection: (direction: string) => void;

  // Folder navigation
  selectedFolderId: string;
  setSelectedFolderId: (id: string) => void;

  // Recently used folders for quick access
  recentFolders: Folder[];
  addRecentFolder: (folder: Folder) => void;

  // UI state
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;

  // Refresh signals (to trigger refetches across components)
  flashcardsVersion: number;
  refreshFlashcards: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialize state, potentially from localStorage
  const [languageDirection, setLanguageDirection] = useState("auto-en");
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [recentFolders, setRecentFolders] = useState<Folder[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [flashcardsVersion, setFlashcardsVersion] = useState(0);

  // Add a folder to recent folders
  const addRecentFolder = (folder: Folder) => {
    setRecentFolders((prev) => {
      // Remove if already exists
      const filtered = prev.filter((f) => f.id !== folder.id);
      // Add to beginning, limit to 5 recent folders
      return [folder, ...filtered].slice(0, 5);
    });
  };

  // Function to trigger refetch of flashcards across components
  const refreshFlashcards = () => setFlashcardsVersion((v) => v + 1);

  return (
    <AppContext.Provider
      value={{
        languageDirection,
        setLanguageDirection,
        selectedFolderId,
        setSelectedFolderId,
        recentFolders,
        addRecentFolder,
        viewMode,
        setViewMode,
        flashcardsVersion,
        refreshFlashcards,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for using this context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
