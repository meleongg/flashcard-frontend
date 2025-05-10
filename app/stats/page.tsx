import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatsClient } from "./stats-client";

export default async function StatsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <StatsClient session={session} />;
}
