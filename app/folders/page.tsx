import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FoldersClient } from "./folders-client";

export default async function FoldersPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <FoldersClient session={session} />;
}
