import { PhoneShell } from "@/components/PhoneShell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { Profile, Routine, Task, Run } from "@shared/schema";
import { fmtMinutes, todayKey } from "@/lib/format";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Pause, Play, Check, Clock3, SkipForward, ArrowDown, ArrowUp, Trophy, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RunnerState = {
  remaining: Task[]; // ordered queue (current is index 0)
  completed: number;
  skipped: number;
  postponed: number;
  paused: boolean;
  currentStartedAt: number; // ms
  routineStartedAt: number;
  runId?: number;
  finished: boolean;
  earnedStars: number;
  showTransition: boolean;
  lastCompletedName?: string;
};

const TRANSITIONS = [
  "好嘢，下一條啦 🚀",
  "5 秒倒數，繼續！",
  "深呼吸 3 下 → 開始 🌱",
  "個 monster 退咗一格，唔好停 ⚔️",
  "Combo +1，sustain 住 🔥",
];

function pickTransition() {
  return TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
}

export default function RunnerPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: routine } = useQuery<Routine & { tasks: Task[] }>({
    queryKey: ["/api/routines", id],
    enabled: !!id,
    queryFn: () => apiJson("GET", `/api/routines/${id}`),
  });

  const [state, setState] = useState<RunnerState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const initRef = useRef(false);

  // Initialize once
  useEffect(() => {
    if (!routine || !profile || initRef.current) return;
    initRef.current = true;
    const startedAt = Date.now();
    setState({
      remaining: [...routine.tasks].sort((a, b) => a.sortOrder - b.sortOrder),
      completed: 0,
      skipped: 0,
      postponed: 0,
      paused: false,
      currentStartedAt: startedAt,
      routineStartedAt: startedAt,
      finished: false,
      earnedStars: 0,
      showTransition: false,
    });
    // create run record
    apiJson<Run>("POST", "/api/runs", {
      profileId: profile.id,
      routineId: routine.id,
      routineName: routine.name,
      date: todayKey(),
      startedAt,
      finishedAt: null,
      totalTasks: routine.tasks.length,
      completedTasks: 0,
      skippedTasks: 0,
      postponedTasks: 0,
      minutesSpent: 0,
      starsEarned: 0,
      status: "partial",
    }).then((r) => setState((s) => (s ? { ...s, runId: r.id } : s)));
  }, [routine, profile]);

  // tick
  useEffect(() => {
    if (!state || state.paused || state.finished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state?.paused, state?.finished]);

  if (!routine || !profile) {
    return (
      <PhoneShell title="Loading…">
        <div className="soft-card p-6 text-center">Loading routine…</div>
      </PhoneShell>
    );
  }

  if (!state) return null;

  const current = state.remaining[0];
  const totalRoutineMin = routine.tasks.reduce((s, t) => s + t.durationMin, 0);
  const remainingMin = state.remaining.reduce((s, t) => s + t.durationMin, 0);
  const elapsedMs = now - state.routineStartedAt;
  const progressPct = Math.min(100, Math.round(((totalRoutineMin - remainingMin) / Math.max(1, totalRoutineMin)) * 100));
  const taskTargetMs = current ? current.durationMin * 60_000 : 0;
  const taskElapsedMs = current ? Math.max(0, now - state.currentStartedAt) : 0;
  const taskRemainingMs = current ? Math.max(0, taskTargetMs - taskElapsedMs) : 0;
  const taskProgressPct = current ? Math.min(100, Math.round((taskElapsedMs / Math.max(1, taskTargetMs)) * 100)) : 0;
  const taskMins = Math.floor(taskRemainingMs / 60000);
  const taskSecs = Math.floor((taskRemainingMs % 60000) / 1000);

  function patchRun(patch: Partial<Run>) {
    if (!state.runId) return;
    apiJson("PATCH", `/api/runs/${state.runId}`, patch).catch(() => {});
  }

  function complete() {
    if (!current) return;
    const isBreak = !!current.isBreak;
    const earn = isBreak ? 0 : 1; // 1 star per real task
    const next = state.remaining.slice(1);
    const finished = next.length === 0;
    const newCompleted = state.completed + 1;
    const newStars = state.earnedStars + earn;

    // Award star backend
    if (earn > 0) {
      apiJson("POST", `/api/profiles/${profile.id}/stars`, { delta: earn }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/profiles/active"] });
      });
    }

    if (finished) {
      const minutesSpent = Math.round((Date.now() - state.routineStartedAt) / 60000);
      patchRun({
        completedTasks: newCompleted,
        skippedTasks: state.skipped,
        postponedTasks: state.postponed,
        minutesSpent,
        starsEarned: newStars + 3, // bonus 3 for finishing whole routine
        status: "completed",
        finishedAt: Date.now(),
      });
      apiJson("POST", `/api/profiles/${profile.id}/stars`, { delta: 3 }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/profiles/active"] });
        queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      });
      setState({
        ...state,
        remaining: [],
        completed: newCompleted,
        finished: true,
        earnedStars: newStars + 3,
        showTransition: false,
        lastCompletedName: current.name,
      });
    } else {
      setState({
        ...state,
        remaining: next,
        completed: newCompleted,
        currentStartedAt: Date.now(),
        earnedStars: newStars,
        showTransition: !isBreak,
        lastCompletedName: current.name,
      });
      patchRun({
        completedTasks: newCompleted,
        starsEarned: newStars,
      });
    }
  }

  function skip() {
    if (!current) return;
    const next = state.remaining.slice(1);
    const newSkipped = state.skipped + 1;
    if (next.length === 0) {
      const minutesSpent = Math.round((Date.now() - state.routineStartedAt) / 60000);
      patchRun({
        completedTasks: state.completed,
        skippedTasks: newSkipped,
        postponedTasks: state.postponed,
        minutesSpent,
        starsEarned: state.earnedStars,
        status: state.completed > 0 ? "partial" : "abandoned",
        finishedAt: Date.now(),
      });
      setState({ ...state, remaining: [], skipped: newSkipped, finished: true });
    } else {
      setState({
        ...state,
        remaining: next,
        skipped: newSkipped,
        currentStartedAt: Date.now(),
      });
    }
  }

  function postpone() {
    if (!current) return;
    // Move current to end of remaining
    const rest = state.remaining.slice(1);
    setState({
      ...state,
      remaining: [...rest, current],
      postponed: state.postponed + 1,
      currentStartedAt: Date.now(),
    });
  }

  function moveDown() {
    if (state.remaining.length < 2) return;
    const [first, second, ...rest] = state.remaining;
    setState({
      ...state,
      remaining: [second, first, ...rest],
      currentStartedAt: Date.now(),
    });
  }

  function moveLater() {
    if (state.remaining.length < 2) return;
    const [first, ...rest] = state.remaining;
    setState({
      ...state,
      remaining: [...rest, first],
      currentStartedAt: Date.now(),
    });
  }

  function pauseToggle() {
    setState({ ...state, paused: !state.paused });
  }

  function dismissTransition() {
    setState({ ...state, showTransition: false });
  }

  // Finished view
  if (state.finished) {
    const minutesSpent = Math.round((Date.now() - state.routineStartedAt) / 60000);
    return (
      <PhoneShell title="Battle done!">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-3 hover-elevate active-elevate rounded-full px-2 py-1 -ml-2"
          data-testid="link-back-finished"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Today
        </Link>
        <div className="soft-card p-6 text-center pop-in">
          <div className="text-6xl mb-2 float" aria-hidden>{routine.emoji}</div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            <span className="shimmer-text">打贏咗 {routine.name}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            完成 {state.completed} / {routine.tasks.length} tasks · {fmtMinutes(minutesSpent)}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-2 font-bold" data-testid="text-finish-stars">
            <Star className="w-5 h-5 fill-current" /> +{state.earnedStars} stars
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/rewards"
            className="soft-card p-4 text-center hover-elevate active-elevate-2"
            data-testid="link-go-rewards"
          >
            <Trophy className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-sm font-semibold">換獎勵</p>
          </Link>
          <Link
            href="/"
            className="soft-card p-4 text-center hover-elevate active-elevate-2"
            data-testid="link-go-today"
          >
            <Sparkles className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-sm font-semibold">下一場</p>
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell title={routine.name} hideNav>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-3 hover-elevate active-elevate rounded-full px-2 py-1 -ml-2"
        data-testid="link-back-runner"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Quit (saves progress)
      </Link>

      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Overall</span>
          <span data-testid="text-overall-progress">{progressPct}% · {fmtMinutes(remainingMin)} left</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Current task hero */}
      {current && (
        <section
          className="soft-card p-5 mb-4 relative overflow-hidden pop-in"
          data-testid="card-current-task"
          key={current.id}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(120% 80% at 100% 0%, ${routine.color}55, transparent 60%)`,
            }}
          />
          <div className="relative">
            <p className="text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground">
              Now {current.isBreak ? "· Break / chill" : ""}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-5xl float" aria-hidden>{current.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-bold leading-tight" data-testid="text-current-name">
                  {current.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {current.durationMin} min planned
                </p>
              </div>
            </div>
            {current.notes && (
              <p className="mt-3 text-sm bg-muted/60 rounded-xl p-3 text-pretty" data-testid="text-current-notes">
                💡 {current.notes}
              </p>
            )}

            {/* Big timer */}
            <div className="mt-4 flex items-end gap-2">
              <div className="font-display font-bold text-5xl tabular-nums tracking-tight" data-testid="text-timer">
                {state.paused ? "⏸" : `${taskMins}:${taskSecs.toString().padStart(2, "0")}`}
              </div>
              <button
                onClick={pauseToggle}
                className="ml-auto rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-semibold hover-elevate active-elevate flex items-center gap-1"
                data-testid="button-pause"
              >
                {state.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {state.paused ? "Resume" : "Pause"}
              </button>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${taskProgressPct > 100 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(100, taskProgressPct)}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <section className="grid grid-cols-2 gap-2 mb-4" data-testid="actions-runner">
        <button
          onClick={complete}
          className="rounded-2xl bg-primary text-primary-foreground py-4 font-bold hover-elevate active-elevate-2 flex items-center justify-center gap-2"
          data-testid="button-complete"
        >
          <Check className="w-5 h-5" /> Done
          <span className="text-[10px] opacity-70">(swipe ←)</span>
        </button>
        <button
          onClick={postpone}
          className="rounded-2xl bg-secondary text-secondary-foreground py-4 font-bold hover-elevate active-elevate-2 flex items-center justify-center gap-2"
          data-testid="button-postpone"
        >
          <Clock3 className="w-5 h-5" /> Later
          <span className="text-[10px] opacity-70">(swipe →)</span>
        </button>
        <button
          onClick={skip}
          className="rounded-2xl bg-card border border-card-border py-3 font-semibold hover-elevate active-elevate flex items-center justify-center gap-2 text-muted-foreground"
          data-testid="button-skip"
        >
          <SkipForward className="w-4 h-4" /> Skip today
          <span className="text-[10px] opacity-70">(swipe ↑)</span>
        </button>
        <button
          onClick={moveLater}
          className="rounded-2xl bg-card border border-card-border py-3 font-semibold hover-elevate active-elevate flex items-center justify-center gap-2 text-muted-foreground"
          data-testid="button-reorder"
        >
          <ArrowDown className="w-4 h-4" /> Send to end
          <span className="text-[10px] opacity-70">(swipe ↓)</span>
        </button>
      </section>

      {/* Up next list */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Up next</h2>
      <ul className="space-y-1.5" data-testid="list-upcoming">
        {state.remaining.slice(1).map((t, idx) => (
          <li
            key={`${t.id}-${idx}`}
            className={`flex items-center gap-2.5 soft-card px-3 py-2 ${t.isBreak ? "bg-secondary/30" : ""}`}
            data-testid={`upcoming-${idx}`}
          >
            <span className="text-xl" aria-hidden>{t.icon}</span>
            <span className="flex-1 text-sm font-medium truncate">{t.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{t.durationMin}m</span>
          </li>
        ))}
        {state.remaining.length === 1 && (
          <li className="text-xs text-muted-foreground text-center py-3">Last one — push through 🔥</li>
        )}
      </ul>

      {/* Transition prompt overlay */}
      {state.showTransition && state.lastCompletedName && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/30 backdrop-blur-sm pop-in p-4"
          onClick={dismissTransition}
          data-testid="overlay-transition"
        >
          <div className="phone-shell-noop max-w-[360px] w-full soft-card p-6 text-center pointer-events-auto">
            <div className="text-5xl mb-2" aria-hidden>✨</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transition</p>
            <h3 className="font-display text-xl font-bold mt-1 leading-tight">{pickTransition()}</h3>
            <p className="text-sm text-muted-foreground mt-2">完成: {state.lastCompletedName}</p>
            <button
              onClick={dismissTransition}
              className="mt-4 w-full rounded-full bg-primary text-primary-foreground py-2.5 font-bold hover-elevate active-elevate-2"
              data-testid="button-dismiss-transition"
            >
              繼續落去 →
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
