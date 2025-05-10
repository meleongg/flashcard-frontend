import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FlashcardDetailClient } from "./flashcard-detail-client";

export default async function FlashcardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FlashcardDetailClient id={id} session={session} />;
}
