import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QuizHistoryClient } from "./history-client";

export default async function QuizHistoryPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <QuizHistoryClient session={session} />;
}
