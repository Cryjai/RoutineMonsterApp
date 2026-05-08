import { Link, useLocation } from "wouter";
import { Home, ListChecks, Trophy, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Today", icon: Home, testid: "nav-today" },
  { href: "/routines", label: "Routines", icon: ListChecks, testid: "nav-routines" },
  { href: "/coach", label: "AI Coach", icon: Sparkles, testid: "nav-coach" },
  { href: "/achievements", label: "Stars", icon: Trophy, testid: "nav-achievements" },
  { href: "/rewards", label: "Rewards", icon: Gift, testid: "nav-rewards" },
];

export function BottomNav() {
  const [location] = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[440px] px-3 pb-3 pt-2 bg-gradient-to-t from-background/95 via-background/80 to-transparent"
      data-testid="bottom-nav"
    >
      <div className="grid grid-cols-5 gap-1 rounded-full bg-card border border-card-border shadow-md p-1.5">
        {items.map(({ href, label, icon: Icon, testid }) => {
          const active =
            href === "/"
              ? location === "/" || location === ""
              : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold tracking-tight hover-elevate active-elevate-2",
                active ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={testid}
            >
              <Icon className={cn("w-[18px] h-[18px]", active && "fill-primary/15")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
