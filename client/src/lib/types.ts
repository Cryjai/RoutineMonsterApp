import type { Routine, Task } from "@shared/schema";

export type RoutineWithTasks = Routine & { tasks: Task[] };

export type Template = {
  key: string;
  name: string;
  emoji: string;
  color: string;
  notes: string;
  startMinute?: number;
  tasks: Array<{
    name: string;
    icon: string;
    durationMin: number;
    isBreak?: boolean;
    notes?: string;
  }>;
};

export type CoachBreakdown = {
  goal: string;
  minutes: number;
  blocks: Array<{ name: string; icon: string; durationMin: number; isBreak?: boolean; notes?: string }>;
  transitions: string[];
  motivation: string;
};
