import { PhoneShell } from "@/components/PhoneShell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { AppState } from "@shared/schema";
import { Crown, Check, X, ArrowLeft, KeyRound } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPage() {
  const { data: appState } = useQuery<AppState>({ queryKey: ["/api/app-state"] });
  const { toast } = useToast();

  const upgrade = useMutation({
    mutationFn: () => apiJson("POST", "/api/subscription/upgrade"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-state"] });
      toast({ title: "You're Pro now ✨", description: "(prototype: no real charge)" });
    },
  });
  const downgrade = useMutation({
    mutationFn: () => apiJson("POST", "/api/subscription/downgrade"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/app-state"] }),
  });

  const [code, setCode] = useState("");
  const promo = useMutation({
    mutationFn: (c: string) => apiJson("POST", "/api/subscription/promo", { code: c }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-state"] });
      toast({ title: "Promo unlocked 💖", description: "Full access enabled." });
      setCode("");
    },
    onError: () => {
      toast({ title: "Promo code 唔啱", description: "Try again or ask the maker.", variant: "destructive" });
    },
  });

  const isPro = appState?.tier === "pro";

  return (
    <PhoneShell title="Subscription">
      <Link
        href="/profiles"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-3 hover-elevate active-elevate rounded-full px-2 py-1 -ml-2"
        data-testid="link-back-sub"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <p className="text-sm text-muted-foreground mb-4 max-w-[36ch]">
        Free tier 已經夠玩。Pro 加 cloud sync、unlimited routines、AI Coach quota。
      </p>

      <div className="grid gap-3 mb-5">
        <PlanCard
          name="Free"
          price="HK$0"
          features={["3 routines", "Local backup", "Basic AI Coach"]}
          missing={["Cloud sync", "Unlimited rewards"]}
          active={!isPro}
          testid="card-free"
        />
        <PlanCard
          name="Pro"
          price="HK$28 / mo"
          features={["Unlimited routines", "Cloud sync", "Full AI Coach", "Unlimited rewards", "Priority hugs 💕"]}
          highlight
          active={isPro}
          testid="card-pro"
        />
      </div>

      {isPro ? (
        <button
          onClick={() => downgrade.mutate()}
          className="w-full rounded-full border border-card-border bg-card px-4 py-3 text-sm font-semibold hover-elevate active-elevate"
          data-testid="button-downgrade"
        >
          Downgrade to free
        </button>
      ) : (
        <button
          onClick={() => upgrade.mutate()}
          className="w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-bold hover-elevate active-elevate-2 flex items-center justify-center gap-2"
          data-testid="button-upgrade"
        >
          <Crown className="w-4 h-4" /> Upgrade to Pro (mock)
        </button>
      )}

      <div className="mt-6 soft-card p-4" data-testid="card-promo">
        <h3 className="text-sm font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Promo code</h3>
        <p className="text-xs text-muted-foreground mt-1">有 code? 入嚟解鎖 full access。</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            data-testid="input-promo-code"
          />
          <button
            onClick={() => code && promo.mutate(code)}
            disabled={!code || promo.isPending}
            className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-bold hover-elevate active-elevate disabled:opacity-50"
            data-testid="button-redeem-promo"
          >
            Redeem
          </button>
        </div>
        {appState?.promoUnlocked === 1 && (
          <p className="mt-2 text-xs text-primary font-semibold">✓ Promo applied — Pro unlocked.</p>
        )}
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground">
        Prototype note: secrets/payments 喺 client 端唔 secure。出 production 時要 server-side env、
        Google Play Billing / Stripe webhook signing、proper auth (Firebase / Clerk / Auth0)。
      </p>
    </PhoneShell>
  );
}

function PlanCard({
  name,
  price,
  features,
  missing,
  highlight,
  active,
  testid,
}: {
  name: string;
  price: string;
  features: string[];
  missing?: string[];
  highlight?: boolean;
  active?: boolean;
  testid?: string;
}) {
  return (
    <div
      className={`soft-card p-4 ${highlight ? "ring-2 ring-primary" : ""} ${active ? "bg-primary/5" : ""}`}
      data-testid={testid}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg">{name}</h3>
        <p className="font-mono tabular-nums text-sm font-bold">{price}</p>
      </div>
      {active && (
        <p className="text-[10.5px] uppercase tracking-wider font-bold text-primary mt-0.5">Current plan</p>
      )}
      <ul className="mt-2 space-y-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="w-3.5 h-3.5 text-primary" /> {f}
          </li>
        ))}
        {missing?.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
            <X className="w-3.5 h-3.5" /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
