import type { MuscleGroup, WorkoutData, WorkoutSet } from "@/lib/types";

/** Epley estimate, only meaningful up to ~12 reps. */
export function e1rm(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  const r = Math.min(reps, 12);
  return Math.round(weight * (1 + r / 30) * 10) / 10;
}

export function isWorkingSet(s: WorkoutSet) {
  return s.done && s.type !== "warmup" && (s.reps ?? 0) > 0;
}

export function setVolume(s: WorkoutSet) {
  return (s.weight ?? 0) * (s.reps ?? 0);
}

export interface Totals {
  volume: number;
  sets: number;
  reps: number;
  exercises: number;
}

export function workoutTotals(data: WorkoutData): Totals {
  let volume = 0;
  let sets = 0;
  let reps = 0;
  let exercises = 0;
  for (const ex of data.exercises) {
    const working = ex.sets.filter(isWorkingSet);
    if (working.length) exercises++;
    for (const s of working) {
      volume += setVolume(s);
      sets++;
      reps += s.reps ?? 0;
    }
  }
  return { volume: Math.round(volume), sets, reps, exercises };
}

/** Parses "8-12" -> 12, "10" -> 10, "até a falha" -> null. Used as the default reps for new sets. */
export function repsUpper(reps: string | null | undefined): number | null {
  if (!reps) return null;
  const nums = reps.match(/\d+/g);
  if (!nums) return null;
  return Number(nums[nums.length - 1]);
}

export function repsLower(reps: string | null | undefined): number | null {
  if (!reps) return null;
  const nums = reps.match(/\d+/g);
  if (!nums) return null;
  return Number(nums[0]);
}

export function groupSetCounts(
  data: WorkoutData,
  resolve: (id: string) => { group: MuscleGroup; secondary: MuscleGroup[] },
): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {};
  for (const ex of data.exercises) {
    const n = ex.sets.filter(isWorkingSet).length;
    if (!n) continue;
    const { group, secondary } = resolve(ex.exerciseId);
    out[group] = (out[group] ?? 0) + n;
    for (const g of secondary) out[g] = (out[g] ?? 0) + n * 0.5;
  }
  return out;
}

export function formatKg(n: number | null | undefined, digits = 1) {
  if (n == null) return "–";
  const v = Math.round(n * 10 ** digits) / 10 ** digits;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

export function formatVolume(n: number) {
  if (n >= 10000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t`;
  return `${Math.round(n).toLocaleString("pt-BR")} kg`;
}

export function formatDuration(sec: number | null | undefined) {
  if (sec == null) return "–";
  if (sec < 60) return "< 1 min";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m} min`;
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Monday-based start of week in local time. */
export function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

/** Rough estimated duration of a planned day, in minutes (sets × ~45 s of work + rest). */
export function estimateDayMinutes(exercises: { sets: number; restSec: number }[]) {
  const sec = exercises.reduce((acc, e) => acc + e.sets * (45 + e.restSec), 0) + exercises.length * 60;
  return Math.max(5, Math.round(sec / 60 / 5) * 5);
}
