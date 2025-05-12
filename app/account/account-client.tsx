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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Loader2, Save } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Define the schema for user settings
const settingsFormSchema = z.object({
  default_source_lang: z.string(),
  default_target_lang: z.string(),
  default_quiz_length: z
    .number()
    .min(1, "Quiz length must be at least 1")
    .max(100),
  auto_tts: z.boolean(),
  reverse_quiz_default: z.boolean(),
  dark_mode: z.boolean(),
  daily_learning_goal: z.number().min(1, "Goal must be at least 1").max(100),
});

type UserSettings = z.infer<typeof settingsFormSchema>;

// Language options
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

export function AccountClient({ session }: { session: Session }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form
  const form = useForm<UserSettings>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      default_source_lang: "en",
      default_target_lang: "es",
      default_quiz_length: 10,
      auto_tts: true,
      reverse_quiz_default: false,
      dark_mode: false,
      daily_learning_goal: 10,
    },
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const sessionObj = await getSession();
        const token = sessionObj?.accessToken;

        const res = await fetch(`${apiUrl}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch settings: ${res.status}`);
        }

        const data = await res.json();

        // Update form with fetched data
        form.reset({
          default_source_lang: data.default_source_lang || "en",
          default_target_lang: data.default_target_lang || "es",
          default_quiz_length: data.default_quiz_length || 10,
          auto_tts: !!data.auto_tts,
          reverse_quiz_default: !!data.reverse_quiz_default,
          dark_mode: !!data.dark_mode,
          daily_learning_goal: data.daily_learning_goal || 10,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  // Save settings
  const onSubmit = async (data: UserSettings) => {
    try {
      setIsSaving(true);
      const sessionObj = await getSession();
      const token = sessionObj?.accessToken;

      const res = await fetch(`${apiUrl}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to update settings: ${res.status}`);
      }

      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>
            Manage your account settings and learning preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Daily Learning Goal */}
              <FormField
                control={form.control}
                name="daily_learning_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Learning Goal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? 0 : parseInt(value) || 0
                          );
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of cards to review each day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Default Quiz Length */}
              <FormField
                control={form.control}
                name="default_quiz_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Quiz Length</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? 0 : parseInt(value) || 0
                          );
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of cards per quiz session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dark Mode */}
              <FormField
                control={form.control}
                name="dark_mode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Dark Mode</FormLabel>
                      <FormDescription>
                        Use dark theme for the application
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

              {/* Auto TTS */}
              <FormField
                control={form.control}
                name="auto_tts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto Text-to-Speech
                      </FormLabel>
                      <FormDescription>
                        Automatically play pronunciation when viewing cards
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

              {/* Reverse Quiz Default */}
              <FormField
                control={form.control}
                name="reverse_quiz_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Reverse Quiz Default
                      </FormLabel>
                      <FormDescription>
                        Quiz from target language to source language by default
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

              {/* Source Language (previously "Native Language") */}
              <FormField
                control={form.control}
                name="default_source_lang"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Native Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
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
                    <FormDescription>Your native language</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Language (previously "Learning Language") */}
              <FormField
                control={form.control}
                name="default_target_lang"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
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
                    <FormDescription>Language you are learning</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Settings
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* User Profile Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold">
                  {session.user?.name?.[0] || "U"}
                </span>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-medium">{session.user?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {session.user?.email}
              </p>
              {/* Removed the account creation date line */}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => toast.error("This feature is not implemented yet")}
          >
            Delete Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
