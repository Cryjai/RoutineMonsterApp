import { PhoneShell } from "@/components/PhoneShell";
import { useQuery } from "@tanstack/react-query";
import type { Profile, Run } from "@shared/schema";
import type { RoutineWithTasks } from "@/lib/types";
import { fmtTimeOfDay, fmtMinutes, parseWeekdays, nowMinuteOfDay } from "@/lib/format";
import { apiJson } from "@/lib/queryClient";
import { Link } from "wouter";
import { Play, Plus, Sparkles, Bell, BellOff, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function dayGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "夜貓 mode 啟動 🌙";
  if (h < 11) return "Good morning ☀️";
  if (h < 14) return "晏晝啦，補番粒糧 🍙";
  if (h < 18) return "下午 chur 多陣 🚀";
  if (h < 22) return "Wind-down 開始 🌆";
  return "瞓覺前最後一更 ✨";
}

export default function TodayPage() {
  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: routines, isLoading } = useQuery<RoutineWithTasks[]>({
    queryKey: ["/api/routines", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => apiJson("GET", `/api/routines?profileId=${profile!.id}`),
  });
  const { data: runs } = useQuery<Run[]>({
    queryKey: ["/api/runs", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => apiJson("GET", `/api/runs?profileId=${profile!.id}`),
  });

  const today = new Date();
  const todayWeekday = today.getDay();
  const nowMin = nowMinuteOfDay();

  const todayRoutines = (routines ?? [])
    .filter((r) => parseWeekdays(r.weekdays).includes(todayWeekday))
    .sort((a, b) => (a.startMinute ?? 9999) - (b.startMinute ?? 9999));

  const upcoming = todayRoutines.filter((r) => (r.startMinute ?? 9999) >= nowMin);
  const next = upcoming[0];

  const totalMinutesToday = todayRoutines.reduce(
    (sum, r) => sum + r.tasks.reduce((s, t) => s + t.durationMin, 0),
    0,
  );

  const todayKeyStr = today.toISOString().slice(0, 10);
  const todayCompleted = (runs ?? []).filter(
    (r) => r.date === todayKeyStr && r.status === "completed",
  ).length;

  return (
    <PhoneShell>
      {/* Hero greeting */}
      <section className="mb-5 mt-2">
        <p className="text-sm text-muted-foreground" data-testid="text-greeting-sub">
          {dayGreeting()}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight leading-[1.05] mt-1" data-testid="text-greeting">
          今日 cockpit{profile ? `，${profile.name}` : ""}
          <span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-[34ch] text-pretty">
          唔好扮忙 — 揀一條 routine 開戰，打低個 procrastination monster。
        </p>
      </section>

      {/* Stats strip */}
      <section className="mb-5 grid grid-cols-3 gap-2" data-testid="stats-strip">
        <StatCard label="今日 routines" value={todayRoutines.length} testid="stat-routines" />
        <StatCard label="完成" value={todayCompleted} accent testid="stat-completed" />
        <StatCard label="總計" value={fmtMinutes(totalMinutesToday)} small testid="stat-minutes" />
      </section>

      {/* Next-up card */}
      <section className="mb-5">
        <SectionHeading>Next up</SectionHeading>
        {isLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : next ? (
          <NextUpCard r={next} />
        ) : (
          <EmptyNext hasAny={todayRoutines.length > 0} />
        )}
      </section>

      {/* Today's full schedule */}
      <section className="mb-5">
        <SectionHeading
          right={
            <Link
              href="/routines"
              className="text-xs font-semibold text-primary hover-elevate active-elevate rounded-full px-2 py-1"
              data-testid="link-all-routines"
            >
              See all <ChevronRight className="inline w-3 h-3 -mt-px" />
            </Link>
          }
        >
          Today's schedule
        </SectionHeading>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : todayRoutines.length === 0 ? (
          <div className="soft-card p-6 text-center">
            <p className="text-2xl mb-2" aria-hidden>🐣</p>
            <p className="font-semibold">未排今日 routine</p>
            <p className="text-sm text-muted-foreground mb-3">由一條開始就得，唔使一次過完美。</p>
            <Link
              href="/routines"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover-elevate active-elevate-2"
              data-testid="button-add-first-routine"
            >
              <Plus className="w-4 h-4" /> 加第一條
            </Link>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="list-today-routines">
            {todayRoutines.map((r) => (
              <RoutineRow key={r.id} r={r} nowMin={nowMin} />
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-6 grid grid-cols-2 gap-2">
        <Link
          href="/coach"
          className="soft-card p-4 hover-elevate active-elevate-2 flex items-start gap-3"
          data-testid="card-quick-coach"
        >
          <div className="w-10 h-10 grid place-items-center rounded-full bg-secondary text-secondary-foreground">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">AI Coach</p>
            <p className="text-xs text-muted-foreground">Break down 個 task</p>
          </div>
        </Link>
        <Link
          href="/routines"
          className="soft-card p-4 hover-elevate active-elevate-2 flex items-start gap-3"
          data-testid="card-quick-add"
        >
          <div className="w-10 h-10 grid place-items-center rounded-full bg-primary/15 text-primary">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">New routine</p>
            <p className="text-xs text-muted-foreground">由 template 開始</p>
          </div>
        </Link>
      </section>
    </PhoneShell>
  );
}

function SectionHeading({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-base font-display font-bold tracking-tight">
        <span className="squiggle">{children}</span>
      </h2>
      {right}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  small,
  testid,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
  testid?: string;
}) {
  return (
    <div className="soft-card px-3 py-2.5" data-testid={testid}>
      <p className="text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 font-display font-bold ${small ? "text-lg" : "text-2xl"} ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function NextUpCard({ r }: { r: RoutineWithTasks }) {
  const totalMin = r.tasks.reduce((s, t) => s + t.durationMin, 0);
  const startsAt = r.startMinute != null ? fmtTimeOfDay(r.startMinute) : "Anytime";
  return (
    <Link
      href={`/run/${r.id}`}
      className="block soft-card p-4 hover-elevate active-elevate-2 relative overflow-hidden"
      data-testid={`card-next-routine-${r.id}`}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(120% 80% at 100% 0%, ${r.color}55, transparent 60%)`,
        }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="w-14 h-14 grid place-items-center rounded-2xl text-2xl float"
          style={{ background: `${r.color}33`, color: "inherit" }}
          aria-hidden
        >
          {r.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono tabular-nums text-muted-foreground" data-testid={`text-time-${r.id}`}>{startsAt}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{fmtMinutes(totalMin)}</span>
            {r.reminderEnabled ? (
              <span className="ml-auto text-primary"><Bell className="w-3.5 h-3.5" /></span>
            ) : (
              <span className="ml-auto text-muted-foreground/50"><BellOff className="w-3.5 h-3.5" /></span>
            )}
          </div>
          <h3 className="mt-0.5 font-display font-bold text-lg leading-tight truncate" data-testid={`text-routine-name-${r.id}`}>
            {r.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {r.tasks.length} tasks · {r.tasks.slice(0, 3).map((t) => t.icon).join(" ")}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold">
            <Play className="w-4 h-4" /> Start Battle
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyNext({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="soft-card p-5 text-center">
      <p className="text-3xl mb-1" aria-hidden>{hasAny ? "🎉" : "😴"}</p>
      <p className="font-semibold">{hasAny ? "今日打晒怪獸啦！" : "今日仲未排嘢"}</p>
      <p className="text-sm text-muted-foreground">
        {hasAny ? "去 rewards page 換獎勵啦。" : "由 templates 揀一條開始。"}
      </p>
    </div>
  );
}

function RoutineRow({ r, nowMin }: { r: RoutineWithTasks; nowMin: number }) {
  const totalMin = r.tasks.reduce((s, t) => s + t.durationMin, 0);
  const past = r.startMinute != null && r.startMinute + totalMin < nowMin;
  const startsAt = r.startMinute != null ? fmtTimeOfDay(r.startMinute) : "—:—";
  return (
    <li>
      <Link
        href={`/run/${r.id}`}
        className={`flex items-center gap-3 soft-card p-3 hover-elevate active-elevate-2 ${past ? "opacity-60" : ""}`}
        data-testid={`row-routine-${r.id}`}
      >
        <div className="w-10 text-center">
          <p className="font-mono tabular-nums text-xs text-muted-foreground">{startsAt}</p>
        </div>
        <div
          className="w-10 h-10 grid place-items-center rounded-xl text-xl shrink-0"
          style={{ background: `${r.color}33` }}
          aria-hidden
        >
          {r.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{r.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {r.tasks.length} tasks · {fmtMinutes(totalMin)}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>
    </li>
  );
}
