import { useQuery } from "@tanstack/react-query";
import { Wordmark } from "./Logo";
import { Star, Flame, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "wouter";
import type { Profile } from "@shared/schema";

export function TopBar({ title }: { title?: string }) {
  const { theme, toggle } = useTheme();
  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profiles/active"],
  });

  return (
    <header
      className="sticky top-0 z-30 px-4 pt-3 pb-2 backdrop-blur-md bg-background/80 border-b border-border/60"
      data-testid="top-bar"
    >
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="active-elevate rounded-full px-1 py-1 -mx-1" data-testid="link-home-logo">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          {profile && (
            <Link
              href="/profiles"
              className="flex items-center gap-1.5 rounded-full bg-card border border-card-border px-2.5 py-1 text-xs font-semibold hover-elevate active-elevate"
              data-testid="badge-profile"
            >
              <span className="text-base leading-none" aria-hidden>{profile.emoji}</span>
              <span className="hidden xs:inline">{profile.name}</span>
              <span className="flex items-center gap-0.5 ml-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span data-testid="text-stars">{profile.stars}</span>
              </span>
              {profile.streak > 0 && (
                <span className="flex items-center gap-0.5 text-rose-500">
                  <Flame className="w-3.5 h-3.5" />
                  <span data-testid="text-streak">{profile.streak}</span>
                </span>
              )}
            </Link>
          )}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="grid place-items-center w-9 h-9 rounded-full border border-card-border bg-card hover-elevate active-elevate"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {title && (
        <h1 className="mt-3 text-2xl font-display font-bold tracking-tight" data-testid="text-page-title">
          {title}
        </h1>
      )}
    </header>
  );
}
