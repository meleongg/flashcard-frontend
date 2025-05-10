"use client";

import { AppProvider } from "@/context/app-context";
import { LayoutProvider } from "@/context/layout-context";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        <LayoutProvider>{children}</LayoutProvider>
      </AppProvider>
    </SessionProvider>
  );
}
