"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiUrl } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Define the schema for onboarding
const onboardingSchema = z.object({
  default_source_lang: z.string(),
  default_target_lang: z.string(),
  daily_learning_goal: z.number().min(1).max(100),
  default_quiz_length: z.number().min(5).max(50),
  auto_tts: z.boolean().default(true),
  reverse_quiz_default: z.boolean().default(false),
  dark_mode: z.boolean().default(false),
});

// Language options (same as used in account-client.tsx)
const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" },
];

export default function Onboarding({ session }: { session: Session }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const totalSteps = 4;

  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      default_source_lang: "en",
      default_target_lang: "es",
      daily_learning_goal: 10,
      default_quiz_length: 10,
      auto_tts: true,
      reverse_quiz_default: false,
      dark_mode: false,
    },
  });

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    setIsSubmitting(true);
    try {
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      // Add onboarding_completed flag to the settings payload
      const settingsData = {
        ...data,
        onboarding_completed: true, // Add this flag to mark onboarding as complete
      };

      // First, save user settings with the onboarding completed flag
      const res = await fetch(`${apiUrl}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Settings API Error:", {
          status: res.status,
          details: errorData,
        });
        throw new Error(`Failed to save preferences: ${res.status}`);
      }

      toast.success("Preferences saved successfully!");

      // Force a full page reload to refresh the session state
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save preferences"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Flashlearn</CardTitle>
          <CardDescription>
            Let's set up your learning preferences
          </CardDescription>
          <Progress value={(step / totalSteps) * 100} className="mt-2" />
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {step === 1 && (
                <div className="space-y-4 py-2">
                  <h2 className="text-lg font-medium">
                    What languages do you want to use?
                  </h2>

                  <FormField
                    control={form.control}
                    name="default_source_lang"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your native language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your native language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The language you already know
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_target_lang"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language you're learning</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language to learn" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The language you want to learn
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 py-2">
                  <h2 className="text-lg font-medium">
                    Set your learning goals
                  </h2>
                  <FormField
                    control={form.control}
                    name="daily_learning_goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily learning goal</FormLabel>
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue(
                                "daily_learning_goal",
                                Math.max(1, field.value - 5)
                              )
                            }
                          >
                            -
                          </Button>
                          <div className="text-center text-2xl font-medium w-12">
                            {field.value}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue(
                                "daily_learning_goal",
                                Math.min(50, field.value + 5)
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                        <FormDescription>
                          Number of flashcards you want to review each day
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 py-2">
                  <h2 className="text-lg font-medium">
                    Additional preferences
                  </h2>

                  <FormField
                    control={form.control}
                    name="default_quiz_length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default quiz length</FormLabel>
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue(
                                "default_quiz_length",
                                Math.max(5, field.value - 5)
                              )
                            }
                          >
                            -
                          </Button>
                          <div className="text-center text-2xl font-medium w-12">
                            {field.value}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue(
                                "default_quiz_length",
                                Math.min(50, field.value + 5)
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                        <FormDescription>
                          Number of cards in each quiz session
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="auto_tts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Text-to-Speech</FormLabel>
                          <FormDescription>
                            Automatically play pronunciation
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reverse_quiz_default"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Reverse Quiz Default</FormLabel>
                          <FormDescription>
                            Test from target language to source
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 py-2">
                  <h2 className="text-lg font-medium">
                    Ready to start learning!
                  </h2>
                  <p className="text-muted-foreground">
                    You've set up your preferences:
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Native language:
                      </span>
                      <span className="font-medium">
                        {
                          languages.find(
                            (l) =>
                              l.value === form.getValues("default_source_lang")
                          )?.label
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Learning language:
                      </span>
                      <span className="font-medium">
                        {
                          languages.find(
                            (l) =>
                              l.value === form.getValues("default_target_lang")
                          )?.label
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily goal:</span>
                      <span className="font-medium">
                        {form.getValues("daily_learning_goal")} cards
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Default quiz length:
                      </span>
                      <span className="font-medium">
                        {form.getValues("default_quiz_length")} cards
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Text-to-Speech:
                      </span>
                      <span className="font-medium">
                        {form.getValues("auto_tts") ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Reverse Quiz Default:
                      </span>
                      <span className="font-medium">
                        {form.getValues("reverse_quiz_default")
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              )}

              {step < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
