"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { ComponentPropsWithoutRef } from "react";

// Extract the Button's prop types using React's utility type
type ButtonProps = ComponentPropsWithoutRef<typeof Button>;

type SignInButtonProps = ButtonProps & {
  label?: string;
};

export function SignInButton({
  className,
  variant = "default",
  size,
  label = "Get Started",
  ...props
}: SignInButtonProps) {
  return (
    <Button
      className={cn("", className)}
      variant={variant}
      size={size}
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      {...props}
    >
      {label}
    </Button>
  );
}
