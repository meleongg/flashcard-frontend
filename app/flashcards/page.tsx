import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FlashcardsClient } from "./flashcards-client";

export default async function FlashcardsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FlashcardsClient session={session} />;
}
