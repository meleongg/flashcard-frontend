"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { data: session } = useSession();

  // Fetch user's theme preference
  useEffect(() => {
    const fetchTheme = async () => {
      if (!session?.accessToken) return;

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/settings`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (response.ok) {
          const settings = await response.json();
          setTheme(settings.dark_mode ? "dark" : "light");
        }
      } catch (error) {
        console.error("Failed to fetch theme:", error);
      }
    };

    fetchTheme();
  }, [session]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
