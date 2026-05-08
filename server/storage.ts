import {
  users,
  profiles,
  routines,
  tasks,
  runs,
  rewards,
  appState,
} from "@shared/schema";
import type {
  User,
  InsertUser,
  Profile,
  InsertProfile,
  Routine,
  InsertRoutine,
  Task,
  InsertTask,
  Run,
  InsertRun,
  Reward,
  InsertReward,
  AppState,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, asc, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Auto-create tables (synchronous, idempotent) — avoids needing drizzle-kit push at runtime
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🐣',
  color TEXT NOT NULL DEFAULT '#FFB37C',
  is_active INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  color TEXT NOT NULL DEFAULT '#FFB37C',
  start_minute INTEGER,
  end_minute INTEGER,
  weekdays TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_minute INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  template_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  duration_min INTEGER NOT NULL DEFAULT 10,
  notes TEXT NOT NULL DEFAULT '',
  is_break INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  routine_id INTEGER NOT NULL,
  routine_name TEXT NOT NULL,
  date TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  total_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  skipped_tasks INTEGER NOT NULL DEFAULT 0,
  postponed_tasks INTEGER NOT NULL DEFAULT 0,
  minutes_spent INTEGER NOT NULL DEFAULT 0,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'partial'
);
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  cost INTEGER NOT NULL DEFAULT 50,
  unlocked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  logged_in_email TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  promo_unlocked INTEGER NOT NULL DEFAULT 0
);
`);

export const db = drizzle(sqlite);

export interface IStorage {
  // legacy
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // profiles
  listProfiles(): Profile[];
  getActiveProfile(): Profile | undefined;
  setActiveProfile(id: number): void;
  createProfile(p: InsertProfile): Profile;
  addProfileStars(id: number, delta: number): void;

  // routines + tasks
  listRoutines(profileId: number): Routine[];
  getRoutine(id: number): Routine | undefined;
  createRoutine(r: InsertRoutine): Routine;
  updateRoutine(id: number, patch: Partial<InsertRoutine>): Routine | undefined;
  deleteRoutine(id: number): void;

  listTasks(routineId: number): Task[];
  createTask(t: InsertTask): Task;
  updateTask(id: number, patch: Partial<InsertTask>): Task | undefined;
  deleteTask(id: number): void;
  reorderTasks(routineId: number, orderedIds: number[]): void;

  // runs
  createRun(r: InsertRun): Run;
  updateRun(id: number, patch: Partial<InsertRun>): Run | undefined;
  listRuns(profileId: number): Run[];

  // rewards
  listRewards(profileId: number): Reward[];
  createReward(r: InsertReward): Reward;
  unlockReward(id: number): Reward | undefined;
  deleteReward(id: number): void;

  // app state
  getAppState(): AppState;
  setAppState(patch: Partial<AppState>): AppState;
}

export class DatabaseStorage implements IStorage {
  // legacy users
  async getUser(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  async getUserByUsername(username: string) {
    return db.select().from(users).where(eq(users.username, username)).get();
  }
  async createUser(insertUser: InsertUser) {
    return db.insert(users).values(insertUser).returning().get();
  }

  // profiles
  listProfiles() {
    return db.select().from(profiles).orderBy(asc(profiles.id)).all();
  }
  getActiveProfile() {
    return db.select().from(profiles).where(eq(profiles.isActive, 1)).get();
  }
  setActiveProfile(id: number) {
    db.update(profiles).set({ isActive: 0 }).run();
    db.update(profiles).set({ isActive: 1 }).where(eq(profiles.id, id)).run();
  }
  createProfile(p: InsertProfile) {
    const created = db.insert(profiles).values(p).returning().get();
    return created;
  }
  addProfileStars(id: number, delta: number) {
    const p = db.select().from(profiles).where(eq(profiles.id, id)).get();
    if (!p) return;
    db.update(profiles).set({ stars: (p.stars ?? 0) + delta }).where(eq(profiles.id, id)).run();
  }

  // routines
  listRoutines(profileId: number) {
    return db
      .select()
      .from(routines)
      .where(eq(routines.profileId, profileId))
      .orderBy(asc(routines.sortOrder), asc(routines.id))
      .all();
  }
  getRoutine(id: number) {
    return db.select().from(routines).where(eq(routines.id, id)).get();
  }
  createRoutine(r: InsertRoutine) {
    return db.insert(routines).values(r).returning().get();
  }
  updateRoutine(id: number, patch: Partial<InsertRoutine>) {
    db.update(routines).set(patch).where(eq(routines.id, id)).run();
    return this.getRoutine(id);
  }
  deleteRoutine(id: number) {
    db.delete(tasks).where(eq(tasks.routineId, id)).run();
    db.delete(routines).where(eq(routines.id, id)).run();
  }

  listTasks(routineId: number) {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.routineId, routineId))
      .orderBy(asc(tasks.sortOrder), asc(tasks.id))
      .all();
  }
  createTask(t: InsertTask) {
    return db.insert(tasks).values(t).returning().get();
  }
  updateTask(id: number, patch: Partial<InsertTask>) {
    db.update(tasks).set(patch).where(eq(tasks.id, id)).run();
    return db.select().from(tasks).where(eq(tasks.id, id)).get();
  }
  deleteTask(id: number) {
    db.delete(tasks).where(eq(tasks.id, id)).run();
  }
  reorderTasks(_routineId: number, orderedIds: number[]) {
    orderedIds.forEach((id, idx) => {
      db.update(tasks).set({ sortOrder: idx }).where(eq(tasks.id, id)).run();
    });
  }

  // runs
  createRun(r: InsertRun) {
    return db.insert(runs).values(r).returning().get();
  }
  updateRun(id: number, patch: Partial<InsertRun>) {
    db.update(runs).set(patch).where(eq(runs.id, id)).run();
    return db.select().from(runs).where(eq(runs.id, id)).get();
  }
  listRuns(profileId: number) {
    return db
      .select()
      .from(runs)
      .where(eq(runs.profileId, profileId))
      .orderBy(desc(runs.startedAt))
      .all();
  }

  // rewards
  listRewards(profileId: number) {
    return db
      .select()
      .from(rewards)
      .where(eq(rewards.profileId, profileId))
      .orderBy(asc(rewards.id))
      .all();
  }
  createReward(r: InsertReward) {
    return db.insert(rewards).values(r).returning().get();
  }
  unlockReward(id: number) {
    db.update(rewards).set({ unlocked: 1 }).where(eq(rewards.id, id)).run();
    return db.select().from(rewards).where(eq(rewards.id, id)).get();
  }
  deleteReward(id: number) {
    db.delete(rewards).where(eq(rewards.id, id)).run();
  }

  // app state
  getAppState(): AppState {
    let s = db.select().from(appState).where(eq(appState.id, 1)).get();
    if (!s) {
      db.insert(appState)
        .values({ id: 1, tier: "free", promoUnlocked: 0 })
        .run();
      s = db.select().from(appState).where(eq(appState.id, 1)).get();
    }
    return s!;
  }
  setAppState(patch: Partial<AppState>): AppState {
    this.getAppState();
    db.update(appState).set(patch).where(eq(appState.id, 1)).run();
    return this.getAppState();
  }
}

export const storage = new DatabaseStorage();

// -------- Seed helpers --------

const TEMPLATES: Array<{
  key: string;
  name: string;
  emoji: string;
  color: string;
  notes: string;
  startMinute?: number;
  tasks: Array<{ name: string; icon: string; durationMin: number; isBreak?: boolean; notes?: string }>;
}> = [
  {
    key: "morning",
    name: "Morning Boot-up",
    emoji: "🌞",
    color: "#FFB37C",
    notes: "唔好扮忙，起身先講",
    startMinute: 7 * 60,
    tasks: [
      { name: "飲一杯水", icon: "💧", durationMin: 2 },
      { name: "刷牙洗面", icon: "🪥", durationMin: 5 },
      { name: "Stretch / 拉筋", icon: "🤸", durationMin: 5 },
      { name: "早餐", icon: "🥐", durationMin: 15 },
      { name: "今日 plan 三件事", icon: "📝", durationMin: 5 },
    ],
  },
  {
    key: "study",
    name: "Study Block",
    emoji: "📚",
    color: "#9D8DF1",
    notes: "Focus mode. Phone 拎走。",
    tasks: [
      { name: "開書 + 設目標", icon: "🎯", durationMin: 5 },
      { name: "Focus 25 分", icon: "🧠", durationMin: 25 },
      { name: "Chill break", icon: "🫧", durationMin: 5, isBreak: true },
      { name: "Focus 25 分", icon: "🧠", durationMin: 25 },
      { name: "Recap 重點", icon: "🗒️", durationMin: 5 },
    ],
  },
  {
    key: "bedtime",
    name: "Bedtime Wind-down",
    emoji: "🌙",
    color: "#7AC7C4",
    notes: "瞓覺時間。手機放遠啲。",
    startMinute: 22 * 60 + 30,
    tasks: [
      { name: "收拾枱面", icon: "🧹", durationMin: 5 },
      { name: "沖涼", icon: "🚿", durationMin: 15 },
      { name: "Skincare", icon: "🧴", durationMin: 5 },
      { name: "閱讀 / 拉筋", icon: "📖", durationMin: 10 },
      { name: "熄燈瞓", icon: "💤", durationMin: 1 },
    ],
  },
  {
    key: "leisure",
    name: "Guilt-free Leisure",
    emoji: "🎮",
    color: "#F58FB6",
    notes: "玩到夠就停手，唔好覺得內疚。",
    tasks: [
      { name: "選一個 activity", icon: "🎲", durationMin: 2 },
      { name: "玩 / Binge 30 分", icon: "🍿", durationMin: 30 },
      { name: "飲水 + Stretch", icon: "💧", durationMin: 3, isBreak: true },
      { name: "再玩 20 分", icon: "🎮", durationMin: 20 },
    ],
  },
  {
    key: "chores",
    name: "Chore Sprint",
    emoji: "🧺",
    color: "#83C9A0",
    notes: "10 分鐘可以做好多嘢。",
    tasks: [
      { name: "倒垃圾", icon: "🗑️", durationMin: 3 },
      { name: "Quick tidy 房間", icon: "🛏️", durationMin: 8 },
      { name: "洗碗 / 抹枱", icon: "🍽️", durationMin: 10 },
      { name: "Reward break", icon: "🍫", durationMin: 5, isBreak: true },
    ],
  },
  {
    key: "dse",
    name: "DSE Cram Block",
    emoji: "🧨",
    color: "#E07A6E",
    notes: "Past paper > 死背書。3 round 攻略。",
    tasks: [
      { name: "睇低分題目", icon: "🔍", durationMin: 10 },
      { name: "做 1 set MC", icon: "✏️", durationMin: 25 },
      { name: "對答案 + 標錯位", icon: "🩹", durationMin: 15 },
      { name: "Chill break", icon: "🍵", durationMin: 10, isBreak: true },
      { name: "做 1 篇 LQ", icon: "📝", durationMin: 30 },
      { name: "整 cheat sheet", icon: "🃏", durationMin: 15 },
    ],
  },
  {
    key: "creator",
    name: "Content Creator Sprint",
    emoji: "🎬",
    color: "#FFD166",
    notes: "Ship > perfect。出咗先講。",
    tasks: [
      { name: "Hook brainstorm", icon: "💡", durationMin: 10 },
      { name: "Outline script", icon: "📋", durationMin: 15 },
      { name: "Shoot / record", icon: "🎥", durationMin: 30 },
      { name: "Coffee break", icon: "☕", durationMin: 10, isBreak: true },
      { name: "Edit rough cut", icon: "✂️", durationMin: 40 },
      { name: "Caption + post", icon: "🚀", durationMin: 15 },
    ],
  },
];

export function seedDefaults() {
  const existing = storage.listProfiles();
  if (existing.length === 0) {
    const duo = storage.createProfile({
      name: "Perplexity Duo",
      emoji: "🦆",
      color: "#FFB37C",
      isActive: 1,
      stars: 0,
      streak: 0,
    });
    storage.createProfile({
      name: "Acry",
      emoji: "🌸",
      color: "#F58FB6",
      isActive: 0,
      stars: 0,
      streak: 0,
    });

    // Seed two starter routines for Duo using templates
    const morning = TEMPLATES.find((t) => t.key === "morning")!;
    const study = TEMPLATES.find((t) => t.key === "study")!;
    [morning, study].forEach((tpl, idx) => {
      const r = storage.createRoutine({
        profileId: duo.id,
        name: tpl.name,
        emoji: tpl.emoji,
        color: tpl.color,
        startMinute: tpl.startMinute ?? null,
        endMinute: null,
        weekdays: "[1,2,3,4,5]",
        reminderEnabled: 0,
        reminderMinute: null,
        notes: tpl.notes,
        templateKey: tpl.key,
        sortOrder: idx,
      });
      tpl.tasks.forEach((t, i) =>
        storage.createTask({
          routineId: r.id,
          name: t.name,
          icon: t.icon,
          durationMin: t.durationMin,
          notes: t.notes ?? "",
          isBreak: t.isBreak ? 1 : 0,
          sortOrder: i,
        })
      );
    });

    // Seed sample rewards for Duo
    storage.createReward({ profileId: duo.id, name: "Binge 1 集劇", emoji: "📺", cost: 100, unlocked: 0 });
    storage.createReward({ profileId: duo.id, name: "Boba 一杯", emoji: "🧋", cost: 60, unlocked: 0 });
    storage.createReward({ profileId: duo.id, name: "Day off chore", emoji: "🛋️", cost: 200, unlocked: 0 });
  }
  // Ensure app_state row exists
  storage.getAppState();
}

export function listTemplates() {
  return TEMPLATES.map(({ tasks, ...rest }) => ({ ...rest, tasks }));
}
