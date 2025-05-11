import { HeroImage } from "@/components/HeroImage";
import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { BookOpen, Brain, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getAuthSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background z-10">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8 justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Flashlearn</span>
          </div>
          <div>
            <SignInButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Change to grid for better control */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Learn Languages <span className="text-primary">Faster</span>{" "}
                with AI-Powered Flashcards
              </h1>
              <p className="text-xl text-muted-foreground">
                Create intelligent flashcards that adapt to your learning style.
                Master vocabulary in any language with our smart spaced
                repetition system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <SignInButton />
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Image container with explicit z-index */}
            <div className="relative order-1 lg:order-2 z-10 lg:z-0">
              <div className="bg-muted rounded-xl overflow-hidden shadow-xl">
                <div className="aspect-video min-h-[250px] md:min-h-[300px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                    <HeroImage />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Supercharge Your Language Learning
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform makes vocabulary acquisition faster and
              more effective than traditional methods.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="h-10 w-10 text-primary" />}
              title="AI-Generated Content"
              description="Let AI create flashcards with examples, phonetics and contextual usage"
            />
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-primary" />}
              title="Smart Repetition"
              description="Review cards at optimal intervals based on your learning progress"
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-primary" />}
              title="Multiple Languages"
              description="Support for dozens of languages with accurate pronunciations"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Flashlearn Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to accelerate your language learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Create Flashcards"
              description="Add words manually or generate cards with our AI assistant"
            />
            <StepCard
              number={2}
              title="Practice Daily"
              description="Review your cards using our spaced repetition system"
            />
            <StepCard
              number={3}
              title="Track Progress"
              description="Monitor your learning and focus on challenging words"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to accelerate your language learning?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of language learners who have improved their
            vocabulary retention with Flashlearn.
          </p>
          <SignInButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">Flashlearn</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
          <div className="text-center md:text-left text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Flashlearn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <CardContent className="p-0">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
