"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Session } from "next-auth";
import { useEffect, useState } from "react";

export function FoldersClient({ session }: { session: Session }) {
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Fetch folders
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    // Your existing fetch folders code
  };

  const createFolder = async () => {
    // Implementation for creating a new folder
  };

  const deleteFolder = async (id: string) => {
    // Implementation for deleting a folder
  };

  const renameFolder = async (id: string, newName: string) => {
    // Implementation for renaming a folder
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
            />
            <Button
              onClick={createFolder}
              disabled={isLoading || !newFolderName.trim()}
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Folders list */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your Folders</h2>

        {folders.length === 0 ? (
          <div className="p-8 text-center border rounded-md bg-muted/30">
            <p className="text-muted-foreground">No folders created yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {folders.map((folder) => (
              // <FolderItem
              //   key={folder.id}
              //   folder={folder}
              //   onRename={renameFolder}
              //   onDelete={deleteFolder}
              // />
              <p>Hello</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
