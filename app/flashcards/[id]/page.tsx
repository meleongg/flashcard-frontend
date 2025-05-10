import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FlashcardDetailClient } from "./flashcard-detail-client";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function FlashcardDetailPage({ params }: PageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FlashcardDetailClient id={params.id} session={session} />;
}
