"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <Button
      className="w-full"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      Get Started
    </Button>
  );
}
