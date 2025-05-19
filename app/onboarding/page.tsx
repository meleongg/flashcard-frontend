import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await getAuthSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // If the user has already completed onboarding, send them to dashboard
  // This is a failsafe in case they try to manually access /onboarding
  if (session && !session.isNewUser) {
    redirect("/dashboard");
  }

  return <OnboardingClient session={session} />;
}
