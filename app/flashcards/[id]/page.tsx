import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FlashcardDetailClient } from "./flashcard-detail-client";

export default async function FlashcardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FlashcardDetailClient id={params.id} session={session} />;
}
