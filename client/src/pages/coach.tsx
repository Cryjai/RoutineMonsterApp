import { PhoneShell } from "@/components/PhoneShell";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { Profile } from "@shared/schema";
import type { CoachBreakdown } from "@/lib/types";
import { useState } from "react";
import { Sparkles, Wand2, Plus, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  "DSE Bio past paper",
  "瞓覺前 wind down",
  "Edit YouTube video",
  "執房 30 分鐘",
  "Maths revision",
];

export default function CoachPage() {
  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { toast } = useToast();
  const [goal, setGoal] = useState("");
  const [minutes, setMinutes] = useState(45);
  const [result, setResult] = useState<CoachBreakdown | null>(null);

  const breakdown = useMutation({
    mutationFn: () => apiJson<CoachBreakdown>("POST", "/api/coach/breakdown", { goal, minutes }),
    onSuccess: (data) => setResult(data),
  });

  const saveAsRoutine = useMutation({
    mutationFn: async () => {
      if (!profile || !result) throw new Error("missing");
      const r = await apiJson<{ id: number }>("POST", "/api/routines", {
        profileId: profile.id,
        name: result.goal,
        emoji: "🤖",
        color: "#9D8DF1",
        startMinute: null,
        endMinute: null,
        weekdays: "[0,1,2,3,4,5,6]",
        reminderEnabled: 0,
        reminderMinute: null,
        notes: result.motivation,
        templateKey: null,
        sortOrder: 99,
      });
      for (let i = 0; i < result.blocks.length; i++) {
        const b = result.blocks[i];
        await apiJson("POST", "/api/tasks", {
          routineId: r.id,
          name: b.name,
          icon: b.icon,
          durationMin: b.durationMin,
          notes: b.notes ?? "",
          isBreak: b.isBreak ? 1 : 0,
          sortOrder: i,
        });
      }
      return r;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      toast({ title: "Saved as routine ✨", description: "去 Routines page 開戰。" });
    },
  });

  return (
    <PhoneShell title="AI Coach">
      <div className="soft-card p-4 mb-4 flex items-start gap-3" data-testid="card-coach-intro">
        <div className="w-10 h-10 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">同你拆 task</p>
          <p className="text-xs text-muted-foreground">
            講你想做乜，我幫你拆 ADHD-friendly 步驟（含 break + transition prompts）。
          </p>
        </div>
      </div>

      <div className="soft-card p-4 mb-4 space-y-3" data-testid="form-coach">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="goal">Goal / 想做乜</label>
        <input
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. DSE Bio past paper, 瞓覺前 wind down"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          data-testid="input-goal"
        />

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setGoal(p)}
              className="rounded-full border border-card-border bg-card px-2.5 py-1 text-xs hover-elevate active-elevate"
              data-testid={`preset-${p.slice(0, 8)}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Time</label>
          <input
            type="number"
            value={minutes}
            min={5}
            max={180}
            onChange={(e) => setMinutes(Math.max(5, Math.min(180, Number(e.target.value) || 30)))}
            className="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono tabular-nums"
            data-testid="input-minutes"
          />
          <span className="text-xs text-muted-foreground">minutes</span>
          <button
            onClick={() => goal.trim() && breakdown.mutate()}
            disabled={!goal.trim() || breakdown.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover-elevate active-elevate-2 disabled:opacity-50"
            data-testid="button-generate"
          >
            <Wand2 className="w-4 h-4" /> {breakdown.isPending ? "Thinking…" : "Break it down"}
          </button>
        </div>
      </div>

      {result && (
        <section data-testid="coach-result" className="pop-in">
          <div className="soft-card p-4 mb-3 bg-secondary/40">
            <p className="text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground">Coach says</p>
            <p className="mt-1 font-display text-lg font-bold leading-tight" data-testid="text-motivation">
              {result.motivation}
            </p>
          </div>

          <h3 className="text-sm font-display font-bold mb-2"><span className="squiggle">Step-by-step</span></h3>
          <ul className="space-y-2 mb-3">
            {result.blocks.map((b, idx) => (
              <li
                key={idx}
                className={`soft-card p-3 flex items-center gap-3 ${b.isBreak ? "bg-secondary/30" : ""}`}
                data-testid={`block-${idx}`}
              >
                <div className="w-9 h-9 rounded-xl bg-muted grid place-items-center text-xl" aria-hidden>{b.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{b.name}</p>
                  {b.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">💡 {b.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{b.durationMin}m</span>
                {b.isBreak && <Coffee className="w-3.5 h-3.5 text-primary" />}
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-display font-bold mb-2"><span className="squiggle">Transition prompts</span></h3>
          <ul className="space-y-1.5 mb-4" data-testid="list-transitions">
            {result.transitions.map((t, i) => (
              <li key={i} className="text-sm text-muted-foreground bg-muted/60 rounded-xl px-3 py-2">
                • {t}
              </li>
            ))}
          </ul>

          <button
            onClick={() => saveAsRoutine.mutate()}
            disabled={saveAsRoutine.isPending || !profile}
            className="w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-bold hover-elevate active-elevate-2 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            data-testid="button-save-as-routine"
          >
            <Plus className="w-4 h-4" /> Save as routine
          </button>
        </section>
      )}
    </PhoneShell>
  );
}
