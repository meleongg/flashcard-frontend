import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface PosTag {
  word: string;
  pos: string;
  dep: string;
}

interface FlashcardData {
  word: string;
  translation: string;
  phonetic: string;
  pos: string;
  example: string;
  notes: string;
}

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

export const FlashcardResult: React.FC<FlashcardData> = ({
  word,
  translation,
  phonetic,
  pos,
  example,
  notes,
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Flashcard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Word
          </h3>
          <p className="text-lg">{word}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Translation
          </h3>
          <p className="text-lg">
            {translation} ({phonetic})
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Part of Speech
          </h3>
          <Badge variant="secondary">{posDescriptions[pos] || pos}</Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Example
          </h3>
          <p className="text-lg">{example}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Notes
          </h3>
          <p className="text-base text-muted-foreground">{notes}</p>
        </div>
      </CardContent>
    </Card>
  );
};
