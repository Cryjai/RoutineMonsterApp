import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// -------- Profiles (multi-user, prototype-level) --------
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🐣"),
  color: text("color").notNull().default("#FFB37C"),
  isActive: integer("is_active").notNull().default(0), // single active profile
  stars: integer("stars").notNull().default(0),
  streak: integer("streak").notNull().default(0),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

// -------- Routines --------
// weekdays JSON: array of integers 0..6 (0=Sun)
// startMinute/endMinute: minutes since midnight (nullable)
export const routines = sqliteTable("routines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("✨"),
  color: text("color").notNull().default("#FFB37C"),
  startMinute: integer("start_minute"), // optional
  endMinute: integer("end_minute"), // optional target end
  weekdays: text("weekdays").notNull().default("[0,1,2,3,4,5,6]"), // JSON
  reminderEnabled: integer("reminder_enabled").notNull().default(0),
  reminderMinute: integer("reminder_minute"), // minutes before start
  notes: text("notes").notNull().default(""),
  templateKey: text("template_key"), // origin template if any
  sortOrder: integer("sort_order").notNull().default(0),
});
export const insertRoutineSchema = createInsertSchema(routines).omit({ id: true });
export type Routine = typeof routines.$inferSelect;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;

// -------- Tasks (inside routines) --------
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routineId: integer("routine_id").notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("⚡"),
  durationMin: integer("duration_min").notNull().default(10),
  notes: text("notes").notNull().default(""),
  isBreak: integer("is_break").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// -------- Routine runs / history --------
// status: completed | partial | abandoned
export const runs = sqliteTable("runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull(),
  routineId: integer("routine_id").notNull(),
  routineName: text("routine_name").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  startedAt: integer("started_at").notNull(), // ms epoch
  finishedAt: integer("finished_at"),
  totalTasks: integer("total_tasks").notNull(),
  completedTasks: integer("completed_tasks").notNull().default(0),
  skippedTasks: integer("skipped_tasks").notNull().default(0),
  postponedTasks: integer("postponed_tasks").notNull().default(0),
  minutesSpent: integer("minutes_spent").notNull().default(0),
  starsEarned: integer("stars_earned").notNull().default(0),
  status: text("status").notNull().default("partial"),
});
export const insertRunSchema = createInsertSchema(runs).omit({ id: true });
export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;

// -------- Rewards (custom unlocks) --------
export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🎁"),
  cost: integer("cost").notNull().default(50),
  unlocked: integer("unlocked").notNull().default(0),
});
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

// -------- Subscription / app state (single row, id=1) --------
export const appState = sqliteTable("app_state", {
  id: integer("id").primaryKey(),
  loggedInEmail: text("logged_in_email"),
  tier: text("tier").notNull().default("free"), // free | pro
  promoUnlocked: integer("promo_unlocked").notNull().default(0),
});
export type AppState = typeof appState.$inferSelect;

// -------- Users (template default kept for compatibility) --------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
