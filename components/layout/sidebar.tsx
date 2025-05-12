"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLayout } from "@/context/layout-context";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  FolderOpen,
  Home,
  ListTodo,
  PanelLeftClose,
  PanelRightClose,
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
  const {
    sidebarOpen,
    closeSidebar,
    isDesktopCollapsed,
    toggleDesktopSidebar,
  } = useLayout();
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
          "fixed inset-y-0 left-0 z-40 bg-background border-r transition-all duration-300 ease-in-out flex flex-col",
          // Mobile styles
          "w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop styles
          "lg:translate-x-0 lg:static",
          isDesktopCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div
          className={cn(
            "flex items-center px-4 py-6 border-b",
            isDesktopCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isDesktopCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold">Flashlearn</h1>
              </div>

              {/* Desktop toggle button */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex ml-2"
                onClick={toggleDesktopSidebar}
                aria-label={
                  isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <BrainCircuit className="h-6 w-6 text-primary" />

              {/* Desktop toggle button when collapsed */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={toggleDesktopSidebar}
                aria-label="Expand sidebar"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-2 space-y-1 mt-4 overflow-y-auto flex-grow">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return isDesktopCollapsed ? (
                // Collapsed view with tooltips
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex justify-center items-center h-10 w-10 rounded-md mx-auto",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                // Expanded view
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
          </TooltipProvider>
        </nav>
      </aside>
    </>
  );
}
