"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Session } from "next-auth";
import { useEffect, useState } from "react";

export function QuizClient({ session }: { session: Session }) {
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [quizOptions, setQuizOptions] = useState({
    cardCount: 10,
    includeReverse: false,
  });

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    // Your existing fetch folders code
  };

  const startQuiz = async () => {
    // Implementation for starting a new quiz
    // This would redirect to /quiz/session/[id]
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Quiz Mode</h1>

      <Card>
        <CardHeader>
          <CardTitle>Start a New Quiz</CardTitle>
          <CardDescription>
            Test your knowledge with flashcards from your collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder">Select Folder</Label>
            <Select
              value={selectedFolderId || ""}
              onValueChange={setSelectedFolderId}
            >
              <SelectTrigger id="folder">
                <SelectValue placeholder="Select a folder" />
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

          <div className="space-y-2">
            <Label htmlFor="cardCount">Number of Cards</Label>
            <Input
              id="cardCount"
              type="number"
              min={1}
              max={100}
              value={quizOptions.cardCount}
              onChange={(e) =>
                setQuizOptions({
                  ...quizOptions,
                  cardCount: parseInt(e.target.value) || 10,
                })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeReverse"
              checked={quizOptions.includeReverse}
              onCheckedChange={(checked) =>
                setQuizOptions({
                  ...quizOptions,
                  includeReverse: !!checked,
                })
              }
            />
            <label
              htmlFor="includeReverse"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include reverse cards (test translation → word)
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={startQuiz}
            disabled={!selectedFolderId && selectedFolderId !== "all"}
          >
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
