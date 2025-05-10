"use client";

import { Button } from "@/components/ui/button";
import { useLayout } from "@/context/layout-context";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  FolderOpen,
  Home,
  ListTodo,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/flashcards", label: "Flashcards", icon: ListTodo },
  { href: "/folders", label: "Folders", icon: FolderOpen },
  { href: "/quiz", label: "Quiz", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useLayout();
  const prevPathRef = useRef(pathname);

  // Close sidebar on navigation (mobile only)
  useEffect(() => {
    // Skip on first render and only close if path actually changed
    if (prevPathRef.current !== pathname && sidebarOpen) {
      closeSidebar();
    }

    // Update the previous path reference
    prevPathRef.current = pathname;
  }, [pathname, sidebarOpen, closeSidebar]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeSidebar();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeSidebar]);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background border-r w-72",
          // Split these for easier debugging
          "transition-transform duration-300 ease-in-out",
          // Control transform based on state
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop styles
          "lg:translate-x-0 lg:static lg:w-64 lg:z-0"
        )}
      >
        <div className="flex items-center justify-between px-4 py-6 border-b">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">FlashCards App</h1>
          </div>

          {/* Close button - mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-2 space-y-1 mt-4 overflow-y-auto h-[calc(100vh-5rem)]">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
