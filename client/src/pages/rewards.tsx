import { PhoneShell } from "@/components/PhoneShell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { Profile, Reward } from "@shared/schema";
import { useState } from "react";
import { Plus, Star, Trash2, Sparkles, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RewardsPage() {
  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: rewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => apiJson("GET", `/api/rewards?profileId=${profile!.id}`),
  });
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [cost, setCost] = useState(50);

  const create = useMutation({
    mutationFn: () =>
      apiJson("POST", "/api/rewards", {
        profileId: profile!.id,
        name,
        emoji,
        cost,
        unlocked: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setName("");
      setEmoji("🎁");
      setCost(50);
      toast({ title: "Reward 加咗", description: "Earn 多啲 stars 換 lar。" });
    },
  });

  const unlock = useMutation({
    mutationFn: (id: number) =>
      apiJson("POST", `/api/rewards/${id}/unlock`, { profileId: profile!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/active"] });
      toast({ title: "Unlocked 🎉", description: "Enjoy 啦，唔好 guilt。" });
    },
    onError: (err: any) => toast({ title: "唔得", description: String(err?.message || err), variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiJson("DELETE", `/api/rewards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/rewards"] }),
  });

  const stars = profile?.stars ?? 0;

  return (
    <PhoneShell title="Rewards">
      <div className="soft-card p-4 mb-5 flex items-center gap-3" data-testid="banner-stars">
        <div className="w-12 h-12 rounded-2xl grid place-items-center bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">
          <Star className="w-6 h-6 fill-current" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Star wallet</p>
          <p className="font-display font-bold text-2xl leading-none">{stars}</p>
        </div>
        <Sparkles className="w-5 h-5 text-primary" />
      </div>

      <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Custom rewards</span></h2>

      <ul className="space-y-2 mb-5" data-testid="list-rewards">
        {(rewards ?? []).length === 0 && (
          <li className="soft-card p-4 text-center text-sm text-muted-foreground">
            未有 reward。設一個目標 — e.g. 100 stars unlock binge 一集。
          </li>
        )}
        {(rewards ?? []).map((r) => {
          const ratio = Math.min(100, Math.round((stars / Math.max(1, r.cost)) * 100));
          const canUnlock = stars >= r.cost && !r.unlocked;
          return (
            <li
              key={r.id}
              className={`soft-card p-3 ${r.unlocked ? "opacity-70" : ""}`}
              data-testid={`reward-${r.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 grid place-items-center text-2xl" aria-hidden>{r.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.cost} stars{r.unlocked ? " · unlocked" : ""}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => unlock.mutate(r.id)}
                    disabled={!canUnlock || unlock.isPending}
                    className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold hover-elevate active-elevate-2 disabled:opacity-50"
                    data-testid={`button-unlock-${r.id}`}
                  >
                    {r.unlocked ? "Got" : "Unlock"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete ${r.name}?`)) del.mutate(r.id); }}
                    className="text-xs text-destructive hover-elevate active-elevate rounded-full px-2 py-1"
                    data-testid={`button-delete-reward-${r.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Add reward</span></h2>
      <div className="soft-card p-3 space-y-2" data-testid="form-add-reward">
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-12 text-center text-xl rounded-lg border border-input bg-background"
            maxLength={4}
            data-testid="input-reward-emoji"
          />
          <input
            placeholder="Reward name (e.g. Boba 一杯)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            data-testid="input-reward-name"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={cost}
            min={1}
            onChange={(e) => setCost(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono tabular-nums"
            data-testid="input-reward-cost"
          />
          <span className="text-xs text-muted-foreground">stars</span>
          <button
            onClick={() => name && create.mutate()}
            disabled={!name || !profile || create.isPending}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-2 text-sm font-bold hover-elevate active-elevate-2 disabled:opacity-50"
            data-testid="button-create-reward"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="mt-6 soft-card p-4 flex items-start gap-3" data-testid="card-shop-tease">
        <div className="w-10 h-10 rounded-2xl bg-secondary grid place-items-center text-secondary-foreground">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">仲想多啲 reward?</p>
          <p className="text-xs text-muted-foreground">
            Pro tier 解鎖無限 rewards、Cloud sync、AI Coach 加 quota。<br />
            <a href="#/subscription" className="text-primary font-semibold underline-offset-2 hover:underline">睇 Subscription →</a>
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
