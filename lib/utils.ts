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
