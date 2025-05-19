import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  // Redirect new users to onboarding
  if (session.isNewUser) {
    redirect("/onboarding");
  }

  return <DashboardClient session={session} />;
}
