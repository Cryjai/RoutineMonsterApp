import { PhoneShell } from "@/components/PhoneShell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { Profile, Routine, Task } from "@shared/schema";
import { fmtTimeOfDay, parseWeekdays, WEEKDAY_LABELS } from "@/lib/format";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Plus, Trash2, ArrowLeft, Save, Bell, GripVertical, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TaskDraft = Pick<Task, "id" | "name" | "icon" | "durationMin" | "notes" | "isBreak" | "sortOrder">;

const COLORS = ["#FFB37C", "#F58FB6", "#9D8DF1", "#7AC7C4", "#83C9A0", "#FFD166", "#E07A6E"];
const EMOJIS = ["✨", "🌞", "🌙", "📚", "🧹", "🎮", "🎯", "🎬", "🧠", "🥐", "🍵", "🚀", "💧", "🧨", "🔥", "🛏️"];

export default function RoutineEditorPage({ params }: { params: { id?: string } }) {
  const isEdit = !!params.id;
  const id = isEdit ? Number(params.id) : null;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: routine } = useQuery<Routine & { tasks: Task[] }>({
    queryKey: ["/api/routines", id],
    enabled: !!id,
    queryFn: () => apiJson("GET", `/api/routines/${id}`),
  });

  const [name, setName] = useState("New Routine");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState("#FFB37C");
  const [startTime, setStartTime] = useState<string>("");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinute, setReminderMinute] = useState(10);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([]);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setEmoji(routine.emoji);
      setColor(routine.color);
      setStartTime(routine.startMinute != null ? toHHMM(routine.startMinute) : "");
      setWeekdays(parseWeekdays(routine.weekdays));
      setReminderEnabled(!!routine.reminderEnabled);
      setReminderMinute(routine.reminderMinute ?? 10);
      setNotes(routine.notes);
      setTasks(routine.tasks.map((t) => ({ ...t })));
    }
  }, [routine]);

  function toMinutes(hhmm: string): number | null {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
  function toHHMM(min: number): string {
    const h = Math.floor(min / 60).toString().padStart(2, "0");
    const m = (min % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function toggleWeekday(d: number) {
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort()));
  }

  function addTask(isBreak = false) {
    setTasks((ts) => [
      ...ts,
      {
        id: -Date.now(),
        name: isBreak ? "Chill break" : "New task",
        icon: isBreak ? "🫧" : "⚡",
        durationMin: isBreak ? 5 : 10,
        notes: "",
        isBreak: isBreak ? 1 : 0,
        sortOrder: ts.length,
      },
    ]);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      const payload = {
        profileId: profile.id,
        name,
        emoji,
        color,
        startMinute: toMinutes(startTime),
        endMinute: null,
        weekdays: JSON.stringify(weekdays),
        reminderEnabled: reminderEnabled ? 1 : 0,
        reminderMinute: reminderEnabled ? reminderMinute : null,
        notes,
        templateKey: routine?.templateKey ?? null,
        sortOrder: routine?.sortOrder ?? 0,
      };
      let r: Routine;
      if (isEdit) {
        r = await apiJson("PATCH", `/api/routines/${id}`, payload);
      } else {
        r = await apiJson("POST", "/api/routines", payload);
      }
      // Save tasks: delete removed, upsert remaining
      const existingIds = (routine?.tasks ?? []).map((t) => t.id);
      const keptIds = tasks.filter((t) => t.id > 0).map((t) => t.id);
      const toDelete = existingIds.filter((eid) => !keptIds.includes(eid));
      for (const did of toDelete) {
        await apiJson("DELETE", `/api/tasks/${did}`);
      }
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        const body = {
          routineId: r.id,
          name: t.name,
          icon: t.icon,
          durationMin: t.durationMin,
          notes: t.notes,
          isBreak: t.isBreak,
          sortOrder: i,
        };
        if (t.id > 0) {
          await apiJson("PATCH", `/api/tasks/${t.id}`, body);
        } else {
          await apiJson("POST", "/api/tasks", body);
        }
      }
      return r;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      toast({ title: "Saved ✨", description: "去 Today cockpit 開戰啦。" });
      navigate("/routines");
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: String(err?.message || err), variant: "destructive" });
    },
  });

  const totalMin = tasks.reduce((s, t) => s + t.durationMin, 0);

  return (
    <PhoneShell title={isEdit ? "Edit routine" : "New routine"}>
      <Link
        href="/routines"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-3 hover-elevate active-elevate rounded-full px-2 py-1 -ml-2"
        data-testid="link-back"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="soft-card p-4 mb-4 space-y-3" data-testid="form-routine">
        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="routine-name">Name</label>
          <input
            id="routine-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
            data-testid="input-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Emoji</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-lg hover-elevate active-elevate ${emoji === e ? "bg-primary/15 ring-2 ring-primary" : "bg-muted"}`}
                  aria-label={`Pick emoji ${e}`}
                  data-testid={`emoji-${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Color</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg hover-elevate active-elevate ${color === c ? "ring-2 ring-foreground/40" : ""}`}
                  style={{ background: c }}
                  aria-label={`Pick color ${c}`}
                  data-testid={`color-${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="routine-start">Start time (optional)</label>
          <input
            id="routine-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base font-mono tabular-nums"
            data-testid="input-start-time"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Days</label>
          <div className="mt-1 flex gap-1.5">
            {WEEKDAY_LABELS.map((l, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleWeekday(i)}
                className={`w-9 h-9 rounded-full text-sm font-semibold hover-elevate active-elevate-2 ${weekdays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                data-testid={`day-${i}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="reminder"
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="w-4 h-4 accent-primary"
            data-testid="checkbox-reminder"
          />
          <label htmlFor="reminder" className="text-sm font-medium flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" /> Remind me
          </label>
          {reminderEnabled && (
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <input
                type="number"
                value={reminderMinute}
                onChange={(e) => setReminderMinute(Number(e.target.value) || 0)}
                className="w-14 rounded-md border border-input bg-background px-2 py-1 text-sm"
                data-testid="input-reminder-min"
              />
              min before
            </span>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="notes">Notes / 鼓勵說話</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            data-testid="input-notes"
            placeholder="e.g. 唔好扮忙，開始啦"
          />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
        <span>Tasks ({tasks.length} · {totalMin}m)</span>
      </h2>

      <ul className="space-y-2 mb-3" data-testid="list-tasks-edit">
        {tasks.map((t, idx) => (
          <li
            key={t.id}
            className={`soft-card p-3 ${t.isBreak ? "bg-secondary/30" : ""}`}
            data-testid={`task-edit-${idx}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground"><GripVertical className="w-4 h-4" /></span>
              <input
                value={t.icon}
                onChange={(e) => setTasks((ts) => ts.map((x, i) => i === idx ? { ...x, icon: e.target.value } : x))}
                className="w-10 h-10 text-center text-xl rounded-lg border border-input bg-background"
                data-testid={`input-task-icon-${idx}`}
              />
              <input
                value={t.name}
                onChange={(e) => setTasks((ts) => ts.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                data-testid={`input-task-name-${idx}`}
              />
              <input
                type="number"
                value={t.durationMin}
                min={1}
                onChange={(e) => setTasks((ts) => ts.map((x, i) => i === idx ? { ...x, durationMin: Math.max(1, Number(e.target.value) || 1) } : x))}
                className="w-14 rounded-lg border border-input bg-background px-2 py-2 text-sm font-mono tabular-nums"
                data-testid={`input-task-min-${idx}`}
              />
              <span className="text-xs text-muted-foreground">m</span>
              <button
                type="button"
                onClick={() => setTasks((ts) => ts.filter((_, i) => i !== idx))}
                className="text-destructive p-1 hover-elevate active-elevate rounded-md"
                aria-label="Delete task"
                data-testid={`button-task-delete-${idx}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!!t.isBreak}
                  onChange={(e) => setTasks((ts) => ts.map((x, i) => i === idx ? { ...x, isBreak: e.target.checked ? 1 : 0 } : x))}
                  className="accent-primary"
                  data-testid={`checkbox-break-${idx}`}
                />
                <Coffee className="w-3 h-3" /> Break / chill
              </label>
              <input
                placeholder="Notes / info boost (e.g. Quizlet link)"
                value={t.notes}
                onChange={(e) => setTasks((ts) => ts.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))}
                className="flex-1 rounded-lg border border-input bg-background px-2 py-1 text-xs"
                data-testid={`input-task-notes-${idx}`}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => addTask(false)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-2 text-sm font-semibold hover-elevate active-elevate"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4" /> Task
        </button>
        <button
          type="button"
          onClick={() => addTask(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary text-secondary-foreground px-3 py-2 text-sm font-semibold hover-elevate active-elevate"
          data-testid="button-add-break"
        >
          <Coffee className="w-4 h-4" /> Break
        </button>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending || tasks.length === 0}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-bold hover-elevate active-elevate-2 disabled:opacity-50"
        data-testid="button-save-routine"
      >
        <Save className="w-4 h-4" /> {save.isPending ? "Saving…" : "Save routine"}
      </button>
    </PhoneShell>
  );
}
