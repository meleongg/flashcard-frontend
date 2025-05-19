import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date | string | number,
  options: {
    weekday?: "long" | "short" | "narrow";
    year?: "numeric" | "2-digit";
    month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
    day?: "numeric" | "2-digit";
    hour?: "numeric" | "2-digit";
    minute?: "numeric" | "2-digit";
    second?: "numeric" | "2-digit";
    timeZone?: string;
    hour12?: boolean;
    showTime?: boolean;
  } = {}
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  // Default formatting options (date only, friendly format)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  // Add time if requested
  if (options.showTime) {
    defaultOptions.hour = "numeric";
    defaultOptions.minute = "2-digit";
    defaultOptions.hour12 = true;
  }

  // Merge default options with provided options
  const formatOptions: Intl.DateTimeFormatOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    // Use browser's Intl API for localized formatting
    return new Intl.DateTimeFormat("en-US", formatOptions).format(dateObj);
  } catch (error) {
    console.error("Date formatting error:", error);
    // Fallback to basic ISO format if errors occur
    return dateObj.toISOString().split("T")[0];
  }
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) {
    return "Now";
  } else if (diffDays > 0) {
    return `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  } else {
    return "Now";
  }
}

export function formatPOS(pos: string) {
  const posMap: { [key: string]: string } = {
    noun: "Noun",
    verb: "Verb",
    adjective: "Adjective",
    adverb: "Adverb",
    pronoun: "Pronoun",
    preposition: "Preposition",
    conjunction: "Conjunction",
    interjection: "Interjection",
  };

  return posMap[pos.toLowerCase()] || pos;
}
