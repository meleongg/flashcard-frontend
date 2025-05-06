"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="h-9 w-24 rounded-md" />;
  }

  return session ? (
    <div className="flex items-center gap-2">
      <span className="text-sm">Hi, {session.user?.name}</span>
      <Button size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign Out
      </Button>
    </div>
  ) : (
    <Button
      size="sm"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      Sign In
    </Button>
  );
}
