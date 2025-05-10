import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditFlashcardClient } from "./edit-client";

export default async function EditFlashcardPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <EditFlashcardClient id={params.id} session={session} />;
}
