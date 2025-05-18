import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FlashcardReviewClient } from "./review-client";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return <FlashcardReviewClient session={session} />;
}
