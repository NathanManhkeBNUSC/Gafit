import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { groupResolver } from "@/lib/catalog";
import { BASE_RECOVERY_H, TRAINABLE_GROUPS } from "@/lib/muscles";
import type { MuscleGroup } from "@/lib/types";
import type { ExerciseProgress, ProgressSummary, RecoveryItem } from "./progress-types";
export type { ExerciseProgress, ProgressSummary, RecoveryItem };

const DAY = 86400000;

/**
 * Week boundaries are computed in the user's time zone offset (minutes, as returned by
 * Date#getTimezoneOffset in the browser) so "this week" matches what they see on the phone.
 */
export async function progressSummary(userId: string, weeklyGoal: number, tzOffsetMin = 180): Promise<ProgressSummary> {
  const db = await getDb();
  const now = new Date();
  const shift = (d: Date) => new Date(d.getTime() - tzOffsetMin * 60000); // to "local" wall clock in UTC fields
  const since = new Date(now.getTime() - 12 * 7 * DAY - 7 * DAY);

  const workouts = await db
    .select({
      id: schema.workouts.id,
      startedAt: schema.workouts.startedAt,
      summary: schema.workouts.summary,
    })
    .from(schema.workouts)
    .where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.status, "done"), gte(schema.workouts.startedAt, since)))
    .orderBy(desc(schema.workouts.startedAt));

  const cardio = await db
    .select({ durationMin: schema.cardioLogs.durationMin, performedAt: schema.cardioLogs.performedAt, workoutId: schema.cardioLogs.workoutId })
    .from(schema.cardioLogs)
    .where(and(eq(schema.cardioLogs.userId, userId), gte(schema.cardioLogs.performedAt, since)));

  // Local-week helpers using UTC getters on shifted dates.
  const weekStartOf = (d: Date) => {
    const x = shift(d);
    const day = (x.getUTCDay() + 6) % 7;
    return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate() - day);
  };
  const dayKey = (d: Date) => shift(d).toISOString().slice(0, 10);
  const thisWeek = weekStartOf(now);

  // A "training day" is any day with a finished workout or standalone cardio.
  const trainingDays = new Map<number, Set<string>>();
  const addDay = (d: Date) => {
    const wk = weekStartOf(d);
    if (!trainingDays.has(wk)) trainingDays.set(wk, new Set());
    trainingDays.get(wk)!.add(dayKey(d));
  };
  workouts.forEach((w) => addDay(w.startedAt));
  cardio.filter((c) => !c.workoutId).forEach((c) => addDay(c.performedAt));

  const weekDays = [...(trainingDays.get(thisWeek) ?? [])].sort();
  let weekStreak = 0;
  if (weekDays.length >= weeklyGoal) weekStreak++;
  for (let wk = thisWeek - 7 * DAY; ; wk -= 7 * DAY) {
    if ((trainingDays.get(wk)?.size ?? 0) >= weeklyGoal) weekStreak++;
    else break;
    if (wk < since.getTime()) break;
  }

  const weeks: ProgressSummary["weeks"] = [];
  for (let i = 11; i >= 0; i--) {
    const start = thisWeek - i * 7 * DAY;
    const ws = workouts.filter((w) => weekStartOf(w.startedAt) === start);
    weeks.push({
      start: new Date(start).toISOString().slice(0, 10),
      workouts: ws.length,
      volume: Math.round(ws.reduce((a, w) => a + (w.summary?.volume ?? 0), 0)),
      cardioMin: Math.round(cardio.filter((c) => weekStartOf(c.performedAt) === start).reduce((a, c) => a + c.durationMin, 0)),
    });
  }

  const d30 = now.getTime() - 30 * DAY;
  const w30 = workouts.filter((w) => w.startedAt.getTime() >= d30);
  const last30 = {
    workouts: w30.length,
    volume: Math.round(w30.reduce((a, w) => a + (w.summary?.volume ?? 0), 0)),
    sets: w30.reduce((a, w) => a + (w.summary?.sets ?? 0), 0),
    cardioMin: Math.round(cardio.filter((c) => c.performedAt.getTime() >= d30).reduce((a, c) => a + c.durationMin, 0)),
  };

  // Muscle sets and recovery from raw set logs.
  const resolve = await groupResolver(userId);
  const logs = await db
    .select({ exerciseId: schema.setLogs.exerciseId, performedAt: schema.setLogs.performedAt, setType: schema.setLogs.setType, workoutId: schema.setLogs.workoutId })
    .from(schema.setLogs)
    .where(and(eq(schema.setLogs.userId, userId), gte(schema.setLogs.performedAt, new Date(now.getTime() - 7 * DAY))));
  const muscleSets7d: Partial<Record<MuscleGroup, number>> = {};
  // per group -> per workout (time, sets)
  const sessions = new Map<MuscleGroup, Map<string, { t: number; sets: number }>>();
  for (const l of logs) {
    if (l.setType === "warmup") continue;
    const { group, secondary } = resolve(l.exerciseId);
    const add = (g: MuscleGroup, n: number) => {
      muscleSets7d[g] = (muscleSets7d[g] ?? 0) + n;
      if (!sessions.has(g)) sessions.set(g, new Map());
      const m = sessions.get(g)!;
      const s = m.get(l.workoutId) ?? { t: l.performedAt.getTime(), sets: 0 };
      s.sets += n;
      m.set(l.workoutId, s);
    };
    add(group, 1);
    secondary.forEach((g) => add(g, 0.5));
  }
  const recovery: RecoveryItem[] = TRAINABLE_GROUPS.map((group) => {
    const ss = [...(sessions.get(group)?.values() ?? [])].sort((a, b) => b.t - a.t);
    if (!ss.length) return { group, recovery: 1, hoursSince: null, sets: 0 };
    // The most demanding remaining fatigue wins (a heavy session 2 days ago can outweigh a light one today).
    let worst = 1;
    for (const s of ss) {
      const hours = (now.getTime() - s.t) / 3600000;
      const need = Math.min(96, BASE_RECOVERY_H[group] * (0.55 + Math.min(s.sets, 16) / 16));
      worst = Math.min(worst, Math.max(0, Math.min(1, hours / need)));
    }
    return { group, recovery: Math.round(worst * 100) / 100, hoursSince: Math.round((now.getTime() - ss[0].t) / 3600000), sets: ss[0].sets };
  });

  const recentPrs = workouts
    .filter((w) => w.startedAt.getTime() >= d30)
    .flatMap((w) => (w.summary?.prs ?? []).map((p) => ({ ...p, date: w.startedAt.toISOString(), workoutId: w.id })))
    .slice(0, 12);

  const body = await db
    .select({ day: schema.bodyMetrics.day, weightKg: schema.bodyMetrics.weightKg })
    .from(schema.bodyMetrics)
    .where(eq(schema.bodyMetrics.userId, userId))
    .orderBy(asc(schema.bodyMetrics.day));

  const top = await db
    .select({
      exerciseId: schema.setLogs.exerciseId,
      sessions: sql<number>`count(distinct ${schema.setLogs.workoutId})`,
      bestWeight: sql<number>`max(${schema.setLogs.weight})`,
    })
    .from(schema.setLogs)
    .where(and(eq(schema.setLogs.userId, userId), gte(schema.setLogs.performedAt, new Date(now.getTime() - 90 * DAY))))
    .groupBy(schema.setLogs.exerciseId)
    .orderBy(desc(sql`count(distinct ${schema.setLogs.workoutId})`))
    .limit(8);

  return {
    topExercises: top.map((t) => ({ exerciseId: t.exerciseId, sessions: Number(t.sessions), bestWeight: Number(t.bestWeight) })),
    weeklyGoal,
    weekCount: weekDays.length,
    weekDays,
    weekStreak,
    last30,
    weeks,
    muscleSets7d,
    recovery,
    recentPrs,
    bodyWeight: body.map((b) => ({ day: String(b.day), weightKg: b.weightKg })),
  };
}

export async function exerciseProgress(userId: string, exerciseId: string): Promise<ExerciseProgress> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.setLogs)
    .where(and(eq(schema.setLogs.userId, userId), eq(schema.setLogs.exerciseId, exerciseId)))
    .orderBy(asc(schema.setLogs.performedAt), asc(schema.setLogs.exerciseIndex), asc(schema.setLogs.setIndex))
    .limit(5000);
  const byWorkout = new Map<string, ExerciseProgress["sessions"][number]>();
  const records = { weight: 0, e1rm: 0, volume: 0, reps: 0 };
  for (const r of rows) {
    let s = byWorkout.get(r.workoutId);
    if (!s) {
      s = { workoutId: r.workoutId, date: r.performedAt.toISOString(), bestWeight: 0, bestReps: 0, bestE1rm: 0, volume: 0, sets: [] };
      byWorkout.set(r.workoutId, s);
    }
    s.sets.push({ weight: r.weight, reps: r.reps, type: r.setType });
    if (r.setType === "warmup") continue;
    if (r.weight > s.bestWeight || (r.weight === s.bestWeight && r.reps > s.bestReps)) {
      s.bestWeight = r.weight;
      s.bestReps = r.reps;
    }
    s.bestE1rm = Math.max(s.bestE1rm, r.e1rm);
    s.volume += r.volume;
    records.weight = Math.max(records.weight, r.weight);
    records.e1rm = Math.max(records.e1rm, r.e1rm);
    records.reps = Math.max(records.reps, r.reps);
  }
  const sessions = [...byWorkout.values()];
  for (const s of sessions) {
    s.volume = Math.round(s.volume);
    records.volume = Math.max(records.volume, s.volume);
  }
  return { sessions, records };
}
