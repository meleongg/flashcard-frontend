import { SignInButton } from "@/components/SignInButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

// disable caching for this page
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getAuthSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl flex justify-center items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Welcome to Flashlearn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Create AI-powered flashcards to supercharge your language learning.
          </p>
          <SignInButton />
        </CardContent>
      </Card>
    </main>
  );
}
