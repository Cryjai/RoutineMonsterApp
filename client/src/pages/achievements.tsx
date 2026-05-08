import { PhoneShell } from "@/components/PhoneShell";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/queryClient";
import type { Profile, Run } from "@shared/schema";
import { fmtMinutes } from "@/lib/format";
import { Star, Flame, Award, Calendar, Sparkles } from "lucide-react";

export default function AchievementsPage() {
  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: runs } = useQuery<Run[]>({
    queryKey: ["/api/runs", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => apiJson("GET", `/api/runs?profileId=${profile!.id}`),
  });

  const completed = (runs ?? []).filter((r) => r.status === "completed");
  const totalMinutes = completed.reduce((s, r) => s + r.minutesSpent, 0);
  const masteredHours = Math.floor(totalMinutes / 60);
  const stars = profile?.stars ?? 0;
  const streak = computeStreak(runs ?? []);

  // 7-week heatmap (49 days)
  const days = build49DayHeat(runs ?? []);

  const badges = [
    { key: "first", name: "First steps", desc: "完成第一條 routine", emoji: "🐣", got: completed.length >= 1 },
    { key: "five", name: "Hot streak", desc: "5 條 routine", emoji: "🔥", got: completed.length >= 5 },
    { key: "ten", name: "Routine slayer", desc: "10 條 routine", emoji: "⚔️", got: completed.length >= 10 },
    { key: "h1", name: "Mastered hour", desc: "累積 1 小時", emoji: "⏳", got: totalMinutes >= 60 },
    { key: "h5", name: "Five hours deep", desc: "累積 5 小時", emoji: "🧘", got: totalMinutes >= 300 },
    { key: "star50", name: "50 stars", desc: "Earn 50 stars", emoji: "⭐", got: stars >= 50 },
    { key: "star200", name: "Star hoarder", desc: "Earn 200 stars", emoji: "🌟", got: stars >= 200 },
    { key: "streak3", name: "3-day streak", desc: "連續 3 日", emoji: "📅", got: streak >= 3 },
  ];

  return (
    <PhoneShell title="Achievements">
      <p className="text-sm text-muted-foreground mb-4 max-w-[36ch]">
        每完成一場就 +1 颗星，連續日數會儲 streak。慢慢累積，唔使一次過完美。
      </p>

      <section className="grid grid-cols-3 gap-2 mb-5">
        <Stat icon={<Star className="w-4 h-4" />} label="Stars" value={stars} testid="stat-stars-total" />
        <Stat icon={<Flame className="w-4 h-4" />} label="Streak" value={`${streak}d`} testid="stat-streak" />
        <Stat icon={<Sparkles className="w-4 h-4" />} label="Hours" value={`${masteredHours}`} testid="stat-hours" />
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Consistency · 7 weeks</span></h2>
        <div className="soft-card p-4">
          <div className="grid grid-cols-7 gap-1.5" data-testid="heatmap">
            {days.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} runs`}
                className="aspect-square rounded-md"
                style={{
                  background: heatColor(d.count),
                }}
                data-testid={`heat-${d.date}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>少</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((n) => (
                <div key={n} className="w-3 h-3 rounded-sm" style={{ background: heatColor(n) }} />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Badges</span></h2>
        <ul className="grid grid-cols-2 gap-2" data-testid="list-badges">
          {badges.map((b) => (
            <li
              key={b.key}
              className={`soft-card p-3 ${b.got ? "" : "opacity-50 grayscale"}`}
              data-testid={`badge-${b.key}`}
            >
              <div className="text-2xl mb-1" aria-hidden>{b.emoji}</div>
              <p className="font-semibold text-sm leading-tight">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
              {b.got && (
                <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-primary">Unlocked</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-display font-bold mb-2"><span className="squiggle">Recent runs</span></h2>
        {(runs ?? []).length === 0 ? (
          <div className="soft-card p-4 text-center text-sm text-muted-foreground">
            未有 history。打第一場啦 ⚔️
          </div>
        ) : (
          <ul className="space-y-2" data-testid="list-history">
            {(runs ?? []).slice(0, 12).map((r) => (
              <li key={r.id} className="soft-card p-3 flex items-center gap-3" data-testid={`history-${r.id}`}>
                <div className="w-9 h-9 rounded-xl bg-muted grid place-items-center text-base" aria-hidden>
                  {r.status === "completed" ? "✅" : r.status === "partial" ? "🟡" : "🔻"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.routineName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.date} · {r.completedTasks}/{r.totalTasks} tasks · {fmtMinutes(r.minutesSpent)}
                  </p>
                </div>
                {r.starsEarned > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" /> {r.starsEarned}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PhoneShell>
  );
}

function Stat({ icon, label, value, testid }: { icon: React.ReactNode; label: string; value: string | number; testid?: string }) {
  return (
    <div className="soft-card p-3" data-testid={testid}>
      <div className="flex items-center gap-1 text-muted-foreground text-[10.5px] uppercase tracking-wider font-semibold">
        {icon} {label}
      </div>
      <p className="mt-0.5 font-display font-bold text-2xl">{value}</p>
    </div>
  );
}

function build49DayHeat(runs: Run[]) {
  const map = new Map<string, number>();
  for (const r of runs) {
    if (r.status === "completed") map.set(r.date, (map.get(r.date) ?? 0) + 1);
  }
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  // Show oldest → newest left→right, top→bottom (7 cols x 7 rows)
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

function heatColor(count: number) {
  if (count <= 0) return "hsl(var(--muted))";
  if (count === 1) return "hsl(var(--primary) / 0.25)";
  if (count === 2) return "hsl(var(--primary) / 0.5)";
  if (count === 3) return "hsl(var(--primary) / 0.75)";
  return "hsl(var(--primary))";
}

function computeStreak(runs: Run[]): number {
  const dates = new Set(runs.filter((r) => r.status === "completed").map((r) => r.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
