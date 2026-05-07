import type { Express } from "express";
import type { Server } from "node:http";
import { storage, seedDefaults, listTemplates } from "./storage";
import {
  insertProfileSchema,
  insertRoutineSchema,
  insertTaskSchema,
  insertRunSchema,
  insertRewardSchema,
} from "@shared/schema";
import { z } from "zod";

const PROMO_CODE = "AcryStrongestPrettiestGirl";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  seedDefaults();

  // ----- Profiles -----
  app.get("/api/profiles", (_req, res) => {
    res.json(storage.listProfiles());
  });
  app.get("/api/profiles/active", (_req, res) => {
    const p = storage.getActiveProfile();
    if (!p) return res.status(404).json({ message: "No active profile" });
    res.json(p);
  });
  app.post("/api/profiles", (req, res) => {
    const parsed = insertProfileSchema.parse(req.body);
    res.json(storage.createProfile(parsed));
  });
  app.post("/api/profiles/:id/activate", (req, res) => {
    storage.setActiveProfile(Number(req.params.id));
    res.json(storage.getActiveProfile());
  });

  // ----- Templates -----
  app.get("/api/templates", (_req, res) => {
    res.json(listTemplates());
  });
  app.post("/api/templates/:key/install", (req, res) => {
    const tpls = listTemplates();
    const tpl = tpls.find((t) => t.key === req.params.key);
    if (!tpl) return res.status(404).json({ message: "Template not found" });
    const profileId = Number(req.body.profileId);
    if (!profileId) return res.status(400).json({ message: "profileId required" });
    const existing = storage.listRoutines(profileId);
    const r = storage.createRoutine({
      profileId,
      name: tpl.name,
      emoji: tpl.emoji,
      color: tpl.color,
      startMinute: tpl.startMinute ?? null,
      endMinute: null,
      weekdays: "[0,1,2,3,4,5,6]",
      reminderEnabled: 0,
      reminderMinute: null,
      notes: tpl.notes,
      templateKey: tpl.key,
      sortOrder: existing.length,
    });
    tpl.tasks.forEach((t, i) =>
      storage.createTask({
        routineId: r.id,
        name: t.name,
        icon: t.icon,
        durationMin: t.durationMin,
        notes: (t as any).notes ?? "",
        isBreak: t.isBreak ? 1 : 0,
        sortOrder: i,
      })
    );
    res.json({ routine: r, tasks: storage.listTasks(r.id) });
  });

  // ----- Routines -----
  app.get("/api/routines", (req, res) => {
    const profileId = Number(req.query.profileId);
    if (!profileId) return res.status(400).json({ message: "profileId required" });
    const list = storage.listRoutines(profileId).map((r) => ({
      ...r,
      tasks: storage.listTasks(r.id),
    }));
    res.json(list);
  });
  app.get("/api/routines/:id", (req, res) => {
    const r = storage.getRoutine(Number(req.params.id));
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json({ ...r, tasks: storage.listTasks(r.id) });
  });
  app.post("/api/routines", (req, res) => {
    const parsed = insertRoutineSchema.parse(req.body);
    res.json(storage.createRoutine(parsed));
  });
  app.patch("/api/routines/:id", (req, res) => {
    const parsed = insertRoutineSchema.partial().parse(req.body);
    res.json(storage.updateRoutine(Number(req.params.id), parsed));
  });
  app.delete("/api/routines/:id", (req, res) => {
    storage.deleteRoutine(Number(req.params.id));
    res.json({ ok: true });
  });

  // ----- Tasks -----
  app.post("/api/tasks", (req, res) => {
    const parsed = insertTaskSchema.parse(req.body);
    res.json(storage.createTask(parsed));
  });
  app.patch("/api/tasks/:id", (req, res) => {
    const parsed = insertTaskSchema.partial().parse(req.body);
    res.json(storage.updateTask(Number(req.params.id), parsed));
  });
  app.delete("/api/tasks/:id", (req, res) => {
    storage.deleteTask(Number(req.params.id));
    res.json({ ok: true });
  });
  app.post("/api/routines/:id/reorder", (req, res) => {
    const orderedIds = z.array(z.number()).parse(req.body.orderedIds);
    storage.reorderTasks(Number(req.params.id), orderedIds);
    res.json({ ok: true });
  });

  // ----- Runs / history -----
  app.post("/api/runs", (req, res) => {
    const parsed = insertRunSchema.parse(req.body);
    res.json(storage.createRun(parsed));
  });
  app.patch("/api/runs/:id", (req, res) => {
    const parsed = insertRunSchema.partial().parse(req.body);
    const updated = storage.updateRun(Number(req.params.id), parsed);
    // Award stars on completion if status set
    if (parsed.starsEarned && parsed.starsEarned > 0 && updated) {
      storage.addProfileStars(updated.profileId, parsed.starsEarned);
    }
    res.json(updated);
  });
  app.get("/api/runs", (req, res) => {
    const profileId = Number(req.query.profileId);
    if (!profileId) return res.status(400).json({ message: "profileId required" });
    res.json(storage.listRuns(profileId));
  });

  // Add stars directly (used during run completion of individual tasks)
  app.post("/api/profiles/:id/stars", (req, res) => {
    const delta = Number(req.body.delta) || 0;
    storage.addProfileStars(Number(req.params.id), delta);
    res.json({ ok: true });
  });

  // ----- Rewards -----
  app.get("/api/rewards", (req, res) => {
    const profileId = Number(req.query.profileId);
    if (!profileId) return res.status(400).json({ message: "profileId required" });
    res.json(storage.listRewards(profileId));
  });
  app.post("/api/rewards", (req, res) => {
    const parsed = insertRewardSchema.parse(req.body);
    res.json(storage.createReward(parsed));
  });
  app.post("/api/rewards/:id/unlock", (req, res) => {
    const reward = storage
      .listRewards(Number(req.body.profileId))
      .find((r) => r.id === Number(req.params.id));
    if (!reward) return res.status(404).json({ message: "Not found" });
    const profile = storage.listProfiles().find((p) => p.id === reward.profileId);
    if (!profile) return res.status(404).json({ message: "No profile" });
    if (profile.stars < reward.cost) {
      return res.status(400).json({ message: "唔夠 stars" });
    }
    storage.addProfileStars(profile.id, -reward.cost);
    const updated = storage.unlockReward(reward.id);
    res.json(updated);
  });
  app.delete("/api/rewards/:id", (req, res) => {
    storage.deleteReward(Number(req.params.id));
    res.json({ ok: true });
  });

  // ----- App state / login mock / promo -----
  app.get("/api/app-state", (_req, res) => {
    res.json(storage.getAppState());
  });
  app.post("/api/login", (req, res) => {
    const email = String(req.body.email || "").trim();
    if (!email) return res.status(400).json({ message: "Email required" });
    res.json(storage.setAppState({ loggedInEmail: email }));
  });
  app.post("/api/logout", (_req, res) => {
    res.json(storage.setAppState({ loggedInEmail: null }));
  });
  app.post("/api/subscription/upgrade", (_req, res) => {
    res.json(storage.setAppState({ tier: "pro" }));
  });
  app.post("/api/subscription/downgrade", (_req, res) => {
    res.json(storage.setAppState({ tier: "free", promoUnlocked: 0 }));
  });
  app.post("/api/subscription/promo", (req, res) => {
    const code = String(req.body.code || "");
    if (code === PROMO_CODE) {
      return res.json({
        ok: true,
        state: storage.setAppState({ tier: "pro", promoUnlocked: 1 }),
      });
    }
    res.status(400).json({ ok: false, message: "Promo code 唔啱" });
  });

  // ----- AI Coach (deterministic mock) -----
  app.post("/api/coach/breakdown", (req, res) => {
    const goal = String(req.body.goal || "").trim();
    const minutes = Math.max(5, Math.min(180, Number(req.body.minutes) || 30));
    if (!goal) return res.status(400).json({ message: "goal required" });
    const breakdown = generateBreakdown(goal, minutes);
    res.json(breakdown);
  });

  return httpServer;
}

// Deterministic ADHD-friendly task breakdown. No external LLM required.
function generateBreakdown(goal: string, minutes: number) {
  const g = goal.toLowerCase();
  let blocks: Array<{ name: string; icon: string; durationMin: number; isBreak?: boolean; notes?: string }> = [];

  if (/study|past paper|revis|exam|dse|notes/.test(g)) {
    blocks = [
      { name: `Set ONE goal: ${goal}`, icon: "🎯", durationMin: 3, notes: "寫低你想做完乜，唔好開枱即刻打機" },
      { name: "Quick scan / 標重點", icon: "🔍", durationMin: 7 },
      { name: "Focus block 1", icon: "🧠", durationMin: 25 },
      { name: "Stretch + 飲水", icon: "💧", durationMin: 5, isBreak: true },
      { name: "Focus block 2", icon: "🧠", durationMin: 25 },
      { name: "1-min recap", icon: "🗒️", durationMin: 3, notes: "記低 3 個學到嘅 point" },
    ];
  } else if (/clean|tidy|chore|laundry|wash/.test(g)) {
    blocks = [
      { name: "10-sec hype", icon: "🔥", durationMin: 1, notes: "唔好諗，企起身先" },
      { name: "Visible mess sweep", icon: "🧹", durationMin: 8 },
      { name: "Trash + dishes", icon: "🗑️", durationMin: 8 },
      { name: "Mini reward", icon: "🍫", durationMin: 5, isBreak: true },
      { name: "Wipe surfaces", icon: "🧼", durationMin: 6 },
    ];
  } else if (/sleep|bed|night|wind/.test(g)) {
    blocks = [
      { name: "電話放出去客廳", icon: "📵", durationMin: 1 },
      { name: "沖涼", icon: "🚿", durationMin: 12 },
      { name: "Skincare + 拉筋", icon: "🧴", durationMin: 8 },
      { name: "讀書 / podcast", icon: "📖", durationMin: 10, isBreak: true },
      { name: "熄燈瞓", icon: "💤", durationMin: 1 },
    ];
  } else if (/content|video|edit|post|caption/.test(g)) {
    blocks = [
      { name: "Hook brainstorm", icon: "💡", durationMin: 8 },
      { name: "Outline 5 點", icon: "📋", durationMin: 10 },
      { name: "Shoot raw clips", icon: "🎥", durationMin: 25 },
      { name: "Coffee break", icon: "☕", durationMin: 8, isBreak: true },
      { name: "Rough edit", icon: "✂️", durationMin: 30 },
      { name: "Caption + post", icon: "🚀", durationMin: 9 },
    ];
  } else {
    // Generic ADHD-friendly breakdown by minutes
    const focus = Math.max(10, Math.round(minutes * 0.5));
    const focus2 = Math.max(5, Math.round(minutes * 0.3));
    blocks = [
      { name: `Define done: ${goal}`, icon: "🎯", durationMin: 3, notes: "1 句講完乜叫 done" },
      { name: "Set up 工具", icon: "🧰", durationMin: 4 },
      { name: "Focus block 1", icon: "🧠", durationMin: focus },
      { name: "Chill break", icon: "🫧", durationMin: 5, isBreak: true },
      { name: "Focus block 2", icon: "🧠", durationMin: focus2 },
      { name: "Wrap + log 進度", icon: "🗒️", durationMin: 3 },
    ];
  }

  // Scale to total duration roughly
  const total = blocks.reduce((s, b) => s + b.durationMin, 0);
  const scale = minutes / total;
  blocks = blocks.map((b) => ({
    ...b,
    durationMin: Math.max(b.isBreak ? 3 : 5, Math.round(b.durationMin * scale)),
  }));

  const transitions = [
    "好，下一步啦，唔好停。",
    "做完一條 = 多一粒星，繼續！",
    "深呼吸 3 下，再開下一個。",
    "5 秒倒數，開始！",
  ];
  return {
    goal,
    minutes,
    blocks,
    transitions,
    motivation: pickMotivation(g),
  };
}

function pickMotivation(g: string) {
  if (/dse|exam|study/.test(g)) return "唔讀就 chur，讀就 chur 多五分鐘。";
  if (/sleep|bed/.test(g)) return "瞓覺都係 productivity，唔好再 doom-scroll。";
  if (/chore|clean/.test(g)) return "10 分鐘可以執到一個世界。";
  return "唔好扮忙，開始啦。";
}
