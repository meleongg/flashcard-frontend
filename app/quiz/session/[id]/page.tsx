import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QuizSessionClient } from "./session-client";

export default async function QuizSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  return <QuizSessionClient id={id} session={session} />;
}
