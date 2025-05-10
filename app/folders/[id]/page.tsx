import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FolderDetailClient } from "./folder-detail-client";

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FolderDetailClient id={id} session={session} />;
}
