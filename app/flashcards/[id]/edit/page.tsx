import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditFlashcardClient } from "./edit-client";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditFlashcardPage({ params }: PageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <EditFlashcardClient id={params.id} session={session} />;
}
