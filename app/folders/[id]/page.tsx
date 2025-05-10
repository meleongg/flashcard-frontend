import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FolderDetailClient } from "./folder-detail-client";

export default async function FolderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FolderDetailClient id={params.id} session={session} />;
}
