import { PhoneShell } from "@/components/PhoneShell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import type { Profile } from "@shared/schema";
import type { RoutineWithTasks, Template } from "@/lib/types";
import { fmtMinutes, fmtTimeOfDay, parseWeekdays, WEEKDAY_LABELS } from "@/lib/format";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Play, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function RoutinesPage() {
  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profiles/active"] });
  const { data: routines } = useQuery<RoutineWithTasks[]>({
    queryKey: ["/api/routines", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => apiJson("GET", `/api/routines?profileId=${profile!.id}`),
  });
  const { data: templates } = useQuery<Template[]>({ queryKey: ["/api/templates"] });
  const { toast } = useToast();

  const installTpl = useMutation({
    mutationFn: (key: string) =>
      apiJson("POST", `/api/templates/${key}/install`, { profileId: profile!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      toast({ title: "Template added 🎉", description: "Customize 一下就用得。" });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => apiJson("DELETE", `/api/routines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      toast({ title: "Deleted", description: "條 routine 收咗檔。" });
    },
  });

  const [showTpl, setShowTpl] = useState(false);

  return (
    <PhoneShell title="Your routines">
      <p className="text-sm text-muted-foreground mb-4 max-w-[36ch]">
        每條 routine = 一場 mini-battle。Stack 細條好過諗一條長到 overwhelming。
      </p>

      <div className="flex gap-2 mb-5">
        <Link
          href="/routines/new"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover-elevate active-elevate-2"
          data-testid="button-new-routine"
        >
          <Plus className="w-4 h-4" /> New routine
        </Link>
        <button
          onClick={() => setShowTpl((v) => !v)}
          className="rounded-full border border-card-border bg-card px-4 py-2.5 text-sm font-semibold hover-elevate active-elevate"
          data-testid="button-toggle-templates"
        >
          <Sparkles className="inline w-4 h-4 mr-1" /> Templates
        </button>
      </div>

      {showTpl && (
        <section className="mb-6" data-testid="section-templates">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Premade · 一 tap add
          </h2>
          <ul className="space-y-2">
            {(templates ?? []).map((tpl) => {
              const total = tpl.tasks.reduce((s, t) => s + t.durationMin, 0);
              return (
                <li
                  key={tpl.key}
                  className="soft-card p-3 flex items-center gap-3"
                  data-testid={`tpl-${tpl.key}`}
                >
                  <div
                    className="w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0"
                    style={{ background: `${tpl.color}33` }}
                    aria-hidden
                  >
                    {tpl.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tpl.tasks.length} tasks · {fmtMinutes(total)}
                    </p>
                  </div>
                  <button
                    onClick={() => profile && installTpl.mutate(tpl.key)}
                    disabled={!profile || installTpl.isPending}
                    className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover-elevate active-elevate-2 disabled:opacity-50"
                    data-testid={`button-install-${tpl.key}`}
                  >
                    Add
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Mine
      </h2>
      <ul className="space-y-2" data-testid="list-routines">
        {(routines ?? []).length === 0 ? (
          <li className="soft-card p-6 text-center">
            <p className="text-3xl mb-1">🌱</p>
            <p className="font-semibold">未有 routine</p>
            <p className="text-sm text-muted-foreground">由 template 開始最快。</p>
          </li>
        ) : (
          (routines ?? []).map((r) => {
            const total = r.tasks.reduce((s, t) => s + t.durationMin, 0);
            const wd = parseWeekdays(r.weekdays);
            return (
              <li
                key={r.id}
                className="soft-card p-3 hover-elevate"
                data-testid={`card-routine-${r.id}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0"
                    style={{ background: `${r.color}33` }}
                    aria-hidden
                  >
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">{r.startMinute != null ? fmtTimeOfDay(r.startMinute) : "Anytime"}</span>
                      <span>·</span>
                      <span>{fmtMinutes(total)}</span>
                    </div>
                    <p className="font-semibold leading-tight mt-0.5">{r.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {WEEKDAY_LABELS.map((l, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 grid place-items-center rounded-full ${wd.includes(i) ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground/40"}`}
                          aria-hidden
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/run/${r.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover-elevate active-elevate-2"
                    data-testid={`button-run-${r.id}`}
                  >
                    <Play className="w-3.5 h-3.5" /> Start
                  </Link>
                  <Link
                    href={`/routines/${r.id}/edit`}
                    className="rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-semibold hover-elevate active-elevate"
                    data-testid={`button-edit-${r.id}`}
                  >
                    <Pencil className="inline w-3.5 h-3.5 mr-1" /> Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`刪除 ${r.name}?`)) del.mutate(r.id);
                    }}
                    className="rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-semibold text-destructive hover-elevate active-elevate"
                    data-testid={`button-delete-${r.id}`}
                  >
                    <Trash2 className="inline w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </PhoneShell>
  );
}
