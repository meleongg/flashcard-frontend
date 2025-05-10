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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/app-context";
import { apiUrl } from "@/lib/constants";
import { ChevronRight, Folder, Loader, Pencil, Trash2 } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Component for individual folder item
function FolderItem({
  folder,
  onRename,
  onDelete,
}: {
  folder: { id: string; name: string };
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRename = async () => {
    if (!editName.trim() || editName === folder.name) {
      setIsEditing(false);
      setEditName(folder.name);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(folder.id, editName);
      setIsEditing(false);
    } catch (error) {
      setEditName(folder.name); // Reset to original on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-md border bg-card">
      <div className="flex items-center gap-3">
        <Folder className="h-5 w-5 text-primary" />

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-48"
              autoFocus
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditName(folder.name);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Link
            href={`/folders/${folder.id}`}
            className="flex items-center gap-1 text-lg font-medium hover:underline"
          >
            {folder.name}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isEditing && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{folder.name}"? This will not
                delete the flashcards inside, but they will no longer be
                organized in this folder.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(folder.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function FoldersClient({ session }: { session: Session }) {
  const { refreshFlashcards } = useAppContext();
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFolderLoading, setIsFolderLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");

  // Fetch folders
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setIsFolderLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch folders: ${res.status}`);

      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error("Error fetching folders:", err);
      toast.error("Failed to load folders");
    } finally {
      setIsFolderLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (!res.ok) throw new Error(`Failed to create folder: ${res.status}`);

      // Fetch updated folder list
      await fetchFolders();
      setNewFolderName(""); // Clear input
      toast.success("Folder created successfully");
    } catch (err) {
      console.error("Error creating folder:", err);
      toast.error("Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/folder/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to delete folder: ${res.status}`);

      // Update local state without fetching again
      setFolders(folders.filter((folder) => folder.id !== id));
      toast.success("Folder deleted successfully");

      // Refresh flashcards in case they were affected
      refreshFlashcards();
    } catch (err) {
      console.error("Error deleting folder:", err);
      toast.error("Failed to delete folder");
    }
  };

  const renameFolder = async (id: string, newName: string) => {
    try {
      const session = await getSession();
      const token = session?.accessToken;

      const res = await fetch(`${apiUrl}/folder/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) throw new Error(`Failed to rename folder: ${res.status}`);

      // Update local state without fetching again
      setFolders(
        folders.map((folder) =>
          folder.id === id ? { ...folder, name: newName } : folder
        )
      );
      toast.success("Folder renamed successfully");
    } catch (err) {
      console.error("Error renaming folder:", err);
      toast.error("Failed to rename folder");
      throw err; // Throw to handle in the FolderItem component
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Folders</h1>
      </div>

      {/* Create new folder form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Folder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim() && !isLoading) {
                  createFolder();
                }
              }}
            />
            <Button
              onClick={createFolder}
              disabled={isLoading || !newFolderName.trim()}
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Folders list */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Folders</h2>

        {isFolderLoading ? (
          <div className="flex justify-center p-8">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : folders.length === 0 ? (
          <div className="p-8 text-center border rounded-md bg-muted/30">
            <p className="text-muted-foreground">No folders created yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onRename={renameFolder}
                onDelete={deleteFolder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
