import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ServiceWorkerWrapper } from "@/components/ServiceWorkerWrapper";
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
  title: {
    default: "FlashLearn - Smart Language Learning with AI-Powered Flashcards",
    template: "%s | FlashLearn",
  },
  description:
    "Master new languages faster with AI-powered flashcards. Create personalized vocabulary sets, track your progress, and achieve fluency through spaced repetition learning.",
  keywords: [
    "language learning",
    "flashcards",
    "vocabulary",
    "spaced repetition",
    "AI learning",
    "mandarin",
    "english",
    "translation",
  ],

  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "FlashLearn - Smart Language Learning with AI-Powered Flashcards",
    description:
      "Master new languages faster with AI-powered flashcards. Create personalized vocabulary sets, track your progress, and achieve fluency through spaced repetition learning.",
    siteName: "FlashLearn",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FlashLearn - AI-Powered Language Learning",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "FlashLearn - Smart Language Learning",
    description: "Master new languages faster with AI-powered flashcards.",
    images: ["/og-image.png"],
  },

  // Essential icons only
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },

  // PWA
  manifest: "/manifest.json",
  applicationName: "FlashLearn",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlashLearn",
  },

  // SEO essentials
  robots: {
    index: true,
    follow: true,
  },

  other: {
    "theme-color": "#6366f1",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FlashLearn",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const isAuthenticated = !!session?.user;
  const isInOnboarding = !!session?.isNewUser;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ServiceWorkerWrapper />
          {isAuthenticated && !isInOnboarding ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 p-4 md:p-6">{children}</main>
              </div>
            </div>
          ) : (
            <div className="min-h-screen">{children}</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
