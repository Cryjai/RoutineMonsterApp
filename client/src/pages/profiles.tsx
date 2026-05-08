import { PhoneShell } from "@/components/PhoneShell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { Profile, AppState } from "@shared/schema";
import { useState } from "react";
import { Star, Plus, LogOut, LogIn, Crown } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ProfilesPage() {
  const { data: profiles } = useQuery<Profile[]>({ queryKey: ["/api/profiles"] });
  const { data: active } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: appState } = useQuery<AppState>({ queryKey: ["/api/app-state"] });
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🦊");
  const [color, setColor] = useState("#9D8DF1");

  const activate = useMutation({
    mutationFn: (id: number) => apiJson("POST", `/api/profiles/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
  const create = useMutation({
    mutationFn: () =>
      apiJson("POST", "/api/profiles", { name, emoji, color, isActive: 0, stars: 0, streak: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      setName("");
      toast({ title: "Profile 加咗", description: "Tap activate 切換。" });
    },
  });
  const logout = useMutation({
    mutationFn: () => apiJson("POST", "/api/logout"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/app-state"] }),
  });

  return (
    <PhoneShell title="Profiles & account">
      <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Who's playing?</span></h2>
      <ul className="space-y-2 mb-4" data-testid="list-profiles">
        {(profiles ?? []).map((p) => (
          <li
            key={p.id}
            className={`soft-card p-3 flex items-center gap-3 ${active?.id === p.id ? "ring-2 ring-primary" : ""}`}
            data-testid={`profile-${p.id}`}
          >
            <div className="w-12 h-12 rounded-2xl grid place-items-center text-2xl" style={{ background: `${p.color}33` }}>{p.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-amber-500" /> {p.stars} · 🔥 {p.streak}d
              </p>
            </div>
            {active?.id === p.id ? (
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Active</span>
            ) : (
              <button
                onClick={() => activate.mutate(p.id)}
                className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover-elevate active-elevate-2"
                data-testid={`button-activate-${p.id}`}
              >
                Switch
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Add profile</span></h2>
      <div className="soft-card p-3 space-y-2 mb-6" data-testid="form-add-profile">
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="w-12 text-center text-xl rounded-lg border border-input bg-background"
            data-testid="input-profile-emoji"
          />
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            data-testid="input-profile-name"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-input bg-background"
            data-testid="input-profile-color"
          />
        </div>
        <button
          onClick={() => name && create.mutate()}
          disabled={!name || create.isPending}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-2 text-sm font-bold hover-elevate active-elevate-2 disabled:opacity-50"
          data-testid="button-create-profile"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Account</span></h2>
      <div className="soft-card p-4" data-testid="card-account">
        {appState?.loggedInEmail ? (
          <>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="font-semibold text-sm">{appState.loggedInEmail}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" /> {appState.tier === "pro" ? "Pro" : "Free"}
                {appState.promoUnlocked ? " (Promo)" : ""}
              </span>
              <button
                onClick={() => logout.mutate()}
                className="rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-semibold hover-elevate active-elevate flex items-center gap-1"
                data-testid="button-logout"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover-elevate active-elevate-2"
            data-testid="link-login"
          >
            <LogIn className="w-4 h-4" /> Sign in / sign up
          </Link>
        )}
      </div>

      <div className="mt-3">
        <Link
          href="/subscription"
          className="block soft-card p-4 hover-elevate active-elevate flex items-start gap-3"
          data-testid="link-subscription"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 grid place-items-center">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Subscription</p>
            <p className="text-xs text-muted-foreground">Free vs Pro · Promo code</p>
          </div>
        </Link>
      </div>
    </PhoneShell>
  );
}
