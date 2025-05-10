import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditFlashcardClient } from "./edit-client";

// No need for a custom interface here
export default async function EditFlashcardPage(context: {
  params: { id: string };
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <EditFlashcardClient id={context.params.id} session={session} />;
}
