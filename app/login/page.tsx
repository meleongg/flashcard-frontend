"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-semibold">Sign in to Flashcards</h1>
      <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
        Sign in with Google
      </Button>
    </main>
  );
}
