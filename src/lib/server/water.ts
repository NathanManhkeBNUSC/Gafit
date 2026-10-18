import "server-only";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { waterGoal, type WaterGoal } from "@/lib/water";
import type { UserDTO } from "@/lib/types";

const DAY = 86400000;

/** UTC instant range covering a local calendar day, given the browser's getTimezoneOffset(). */
function dayRange(day: string, tzOffsetMin: number) {
  const start = new Date(`${day}T00:00:00.000Z`).getTime() + tzOffsetMin * 60000;
  return { start: new Date(start), end: new Date(start + DAY) };
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function trainingMinutes(userId: string, day: string, tz: number) {
  const db = await getDb();
  const { start, end } = dayRange(day, tz);
  const ws = await db
    .select({ durationSec: schema.workouts.durationSec })
    .from(schema.workouts)
    .where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.status, "done"), gte(schema.workouts.startedAt, start), lte(schema.workouts.startedAt, end)));
  const cs = await db
    .select({ durationMin: schema.cardioLogs.durationMin, workoutId: schema.cardioLogs.workoutId })
    .from(schema.cardioLogs)
    .where(and(eq(schema.cardioLogs.userId, userId), gte(schema.cardioLogs.performedAt, start), lte(schema.cardioLogs.performedAt, end)));
  // Cardio inside a workout is already counted in the workout's duration.
  return ws.reduce((a, w) => a + (w.durationSec ?? 0) / 60, 0) + cs.filter((c) => !c.workoutId).reduce((a, c) => a + c.durationMin, 0);
}

async function latestWeight(userId: string, upTo: string) {
  const db = await getDb();
  const [b] = await db
    .select({ weightKg: schema.bodyMetrics.weightKg })
    .from(schema.bodyMetrics)
    .where(and(eq(schema.bodyMetrics.userId, userId), lte(schema.bodyMetrics.day, upTo)))
    .orderBy(desc(schema.bodyMetrics.day))
    .limit(1);
  return b?.weightKg ?? null;
}

export async function goalFor(user: UserDTO, day: string, tz: number): Promise<WaterGoal & { weightKg: number | null; age: number | null; trainingMin: number }> {
  const weightKg = await latestWeight(user.id, day);
  const age = user.birthYear ? Number(day.slice(0, 4)) - user.birthYear : null;
  const trainingMin = await trainingMinutes(user.id, day, tz);
  const g = waterGoal({ weightKg, heightCm: user.heightCm, age, trainingMin, hotClimate: user.hotClimate, manualGoalMl: user.waterGoalMl });
  return { ...g, weightKg, age, trainingMin: Math.round(trainingMin) };
}

export async function waterDay(user: UserDTO, day: string, tz: number) {
  const db = await getDb();
  const entries = await db
    .select({ id: schema.waterLogs.id, amountMl: schema.waterLogs.amountMl, createdAt: schema.waterLogs.createdAt })
    .from(schema.waterLogs)
    .where(and(eq(schema.waterLogs.userId, user.id), eq(schema.waterLogs.day, day)))
    .orderBy(desc(schema.waterLogs.createdAt));
  const goal = await goalFor(user, day, tz);

  // Last 7 days (oldest first) with each day's own goal.
  const from = addDays(day, -6);
  const rows = await db
    .select({ day: schema.waterLogs.day, amountMl: schema.waterLogs.amountMl })
    .from(schema.waterLogs)
    .where(and(eq(schema.waterLogs.userId, user.id), gte(schema.waterLogs.day, from), lte(schema.waterLogs.day, day)));
  const week = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const d = addDays(from, i);
      const total = rows.filter((r) => String(r.day) === d).reduce((a, r) => a + r.amountMl, 0);
      const g = d === day ? goal.goalMl : (await goalFor(user, d, tz)).goalMl;
      return { day: d, totalMl: total, goalMl: g };
    }),
  );

  return {
    day,
    totalMl: entries.reduce((a, e) => a + e.amountMl, 0),
    entries: entries.map((e) => ({ id: e.id, amountMl: e.amountMl, createdAt: e.createdAt.toISOString() })),
    goal,
    week,
  };
}

export type WaterDayDTO = Awaited<ReturnType<typeof waterDay>>;
