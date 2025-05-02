import { Card } from "@/components/ui/card";

type POSTag = {
  word: string;
  pos: string;
  dep: string;
};

type FlashcardResultProps = {
  original: string;
  translation: string;
  example: string;
  posTags: POSTag[];
};

export function FlashcardResult({
  original,
  translation,
  example,
  posTags,
}: FlashcardResultProps) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Translation</h2>
        <p className="text-sm text-muted-foreground">
          <strong>{original}</strong> → {translation}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Example Sentence</h2>
        <p className="text-sm">{example}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">POS Tags</h2>
        <ul className="text-sm space-y-1">
          {posTags.map((tag, i) => (
            <li key={i}>
              <strong>{tag.word}</strong>: {tag.pos} ({tag.dep})
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
