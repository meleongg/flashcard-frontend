import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getAuthSession } from "@/lib/auth";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const isAuthenticated = !!session?.user;

  // Check if user is in onboarding flow
  const isInOnboarding = !!session?.isNewUser;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {isAuthenticated && !isInOnboarding ? (
            // Authenticated Layout with Sidebar and Header (except during onboarding)
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 p-4 md:p-6">{children}</main>
              </div>
            </div>
          ) : (
            // Unauthenticated Layout or Onboarding (just the content)
            <div className="min-h-screen">{children}</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
