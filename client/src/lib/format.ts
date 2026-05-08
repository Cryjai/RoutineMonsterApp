export function fmtMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function fmtTimeOfDay(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nowMinuteOfDay(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
export const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseWeekdays(json: string): number[] {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.filter((n) => typeof n === "number");
  } catch {}
  return [0, 1, 2, 3, 4, 5, 6];
}
