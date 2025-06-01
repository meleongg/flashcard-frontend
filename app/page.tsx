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
      {/* Enhanced mobile header */}
      <header className="border-b bg-background z-10 sticky top-0">
        <div className="container mx-auto flex h-14 sm:h-16 items-center px-4 sm:px-6 lg:px-8 justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-base sm:text-lg font-bold">Flashlearn</span>
          </div>
          <div>
            <SignInButton />
          </div>
        </div>
      </header>

      {/* Enhanced hero section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Learn Languages <span className="text-primary">Faster</span>{" "}
                with AI-Powered Flashcards
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Create intelligent flashcards that adapt to your learning style.
                Master vocabulary in any language with our smart spaced
                repetition system.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <SignInButton />
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Enhanced hero image */}
            <div className="relative order-1 lg:order-2 z-10 lg:z-0">
              <div className="bg-muted rounded-lg sm:rounded-xl overflow-hidden shadow-lg sm:shadow-xl">
                <div className="aspect-video min-h-[200px] sm:min-h-[250px] md:min-h-[300px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                    <HeroImage />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced features section */}
      <section id="features" className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Supercharge Your Language Learning
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Our AI-powered platform makes vocabulary acquisition faster and
              more effective than traditional methods.
            </p>
          </div>

          {/* Enhanced feature cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              }
              title="AI-Generated Content"
              description="Let AI create flashcards with examples, phonetics and contextual usage"
            />
            <FeatureCard
              icon={<Brain className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
              title="Smart Repetition"
              description="Review cards at optimal intervals based on your learning progress"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
              title="Multiple Languages"
              description="Support for dozens of languages with accurate pronunciations"
            />
          </div>
        </div>
      </section>

      {/* Enhanced steps section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              How Flashlearn Works
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Three simple steps to accelerate your language learning journey
            </p>
          </div>

          {/* Enhanced steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
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

      {/* Enhanced CTA section */}
      <section className="py-12 sm:py-16 bg-primary/5">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            Ready to accelerate your language learning?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
            Join thousands of language learners who have improved their
            vocabulary retention with Flashlearn.
          </p>
          <SignInButton />
        </div>
      </section>

      {/* Enhanced footer */}
      <footer className="py-6 sm:py-8 border-t mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base font-semibold">
                Flashlearn
              </span>
            </div>
            <div className="flex gap-4 sm:gap-6 text-sm text-muted-foreground">
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
          <div className="text-center md:text-left text-xs text-muted-foreground mt-4 sm:mt-6">
            © {new Date().getFullYear()} Flashlearn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Enhanced helper components
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
    <Card className="p-4 sm:p-6 flex flex-col items-center text-center h-full">
      <div className="mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <CardContent className="p-0">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
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
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg sm:text-xl font-bold mb-3 sm:mb-4">
        {number}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2">
        {description}
      </p>
    </div>
  );
}
