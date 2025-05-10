import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QuizClient } from "./quiz-client";

export default async function QuizPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <QuizClient session={session} />;
}
