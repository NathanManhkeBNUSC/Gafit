import "server-only";
import { and, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { newId, shortId } from "@/lib/ids";
import { groupResolver } from "@/lib/catalog";
import { e1rm, groupSetCounts, isWorkingSet, setVolume, workoutTotals } from "@/lib/training";
import type { PlanDay, PrHit, WorkoutDTO, WorkoutData, WorkoutSummary } from "@/lib/types";
import { getActivePlan, getPlan } from "./plans";

type WorkoutRow = typeof schema.workouts.$inferSelect;

export function toWorkoutDTO(w: WorkoutRow): WorkoutDTO {
  return {
    id: w.id,
    planId: w.planId,
    dayId: w.dayId,
    name: w.name,
    status: w.status as WorkoutDTO["status"],
    data: w.data,
    notes: w.notes,
    summary: w.summary ?? null,
    startedAt: w.startedAt.toISOString(),
    finishedAt: w.finishedAt?.toISOString() ?? null,
    durationSec: w.durationSec,
  };
}

export async function getWorkout(userId: string, id: string): Promise<WorkoutRow> {
  const db = await getDb();
  const [w] = await db
    .select()
    .from(schema.workouts)
    .where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.id, id)))
    .limit(1);
  if (!w) throw new HttpError(404, "Treino não encontrado.");
  return w;
}

export async function getActiveWorkout(userId: string): Promise<WorkoutRow | null> {
  const db = await getDb();
  const [w] = await db
    .select()
    .from(schema.workouts)
    .where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.status, "active")))
    .orderBy(desc(schema.workouts.startedAt))
    .limit(1);
  return w ?? null;
}

/** Which day of the active plan comes next: the one after the last finished day of that plan. */
export async function nextPlanDay(userId: string): Promise<{ planId: string; planName: string; day: PlanDay; index: number; total: number } | null> {
  const plan = await getActivePlan(userId);
  if (!plan || !plan.days.length) return null;
  const db = await getDb();
  const [last] = await db
    .select({ dayId: schema.workouts.dayId })
    .from(schema.workouts)
    .where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.planId, plan.id), eq(schema.workouts.status, "done")))
    .orderBy(desc(schema.workouts.startedAt))
    .limit(1);
  let index = 0;
  if (last?.dayId) {
    const i = plan.days.findIndex((d) => d.id === last.dayId);
    if (i >= 0) index = (i + 1) % plan.days.length;
  }
  return { planId: plan.id, planName: plan.name, day: plan.days[index], index, total: plan.days.length };
}

export function dataFromPlanDay(day: PlanDay): WorkoutData {
  return {
    exercises: day.exercises.map((e) => ({
      id: shortId(),
      exerciseId: e.exerciseId,
      planExerciseId: e.id,
      targetReps: e.reps || null,
      restSec: e.restSec,
      notes: e.notes ?? null,
      group: e.group ?? null,
      sets: Array.from({ length: e.sets }, () => ({
        id: shortId(),
        weight: e.weight ?? null,
        reps: null,
        type: "normal" as const,
        done: false,
      })),
    })),
  };
}

export async function startWorkout(
  userId: string,
  opts: { planId?: string | null; dayId?: string | null; name?: string | null },
): Promise<WorkoutDTO> {
  const active = await getActiveWorkout(userId);
  if (active) throw new HttpError(409, "Você já tem um treino em andamento. Termine ou descarte antes de começar outro.");
  let data: WorkoutData = { exercises: [] };
  let name = opts.name?.trim() || "Treino livre";
  let planId: string | null = null;
  let dayId: string | null = null;
  if (opts.planId && opts.dayId) {
    const plan = await getPlan(userId, opts.planId);
    const day = plan.days.find((d) => d.id === opts.dayId);
    if (!day) throw new HttpError(404, "Dia da ficha não encontrado.");
    data = dataFromPlanDay(day);
    name = day.focus ? `${day.name} · ${day.focus}` : day.name;
    planId = plan.id;
    dayId = day.id;
  }
  const db = await getDb();
  const [row] = await db
    .insert(schema.workouts)
    .values({ id: newId(), userId, planId, dayId, name, status: "active", data })
    .returning();
  return toWorkoutDTO(row);
}

export async function updateWorkout(
  userId: string,
  id: string,
  patch: { name?: string; notes?: string | null; data?: WorkoutData; startedAt?: string; durationSec?: number },
): Promise<WorkoutDTO> {
  const w = await getWorkout(userId, id);
  const db = await getDb();
  const values: Partial<typeof schema.workouts.$inferInsert> = {};
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.notes !== undefined) values.notes = patch.notes;
  if (patch.data !== undefined) values.data = patch.data;
  if (patch.startedAt) values.startedAt = new Date(patch.startedAt);
  if (patch.durationSec !== undefined && w.status === "done") values.durationSec = patch.durationSec;
  const [row] = await db
    .update(schema.workouts)
    .set(values)
    .where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.id, id)))
    .returning();
  // Editing a finished session keeps its history and records consistent.
  if (row.status === "done" && (patch.data || patch.startedAt)) return toWorkoutDTO(await finalize(userId, row, false));
  return toWorkoutDTO(row);
}

export async function discardWorkout(userId: string, id: string) {
  await getWorkout(userId, id);
  const db = await getDb();
  await db.delete(schema.cardioLogs).where(and(eq(schema.cardioLogs.userId, userId), eq(schema.cardioLogs.workoutId, id)));
  await db.delete(schema.workouts).where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.id, id)));
}

/** Previous bests per exercise, from sessions strictly before `before`. */
async function previousBests(userId: string, exerciseIds: string[], before: Date, excludeWorkout: string) {
  const out = new Map<string, { weight: number; e1rm: number; volume: number }>();
  if (!exerciseIds.length) return out;
  const db = await getDb();
  const rows = await db
    .select({
      exerciseId: schema.setLogs.exerciseId,
      weight: sql<number>`max(${schema.setLogs.weight})`,
      e1rm: sql<number>`max(${schema.setLogs.e1rm})`,
      volume: sql<number>`max(${schema.setLogs.volume})`,
    })
    .from(schema.setLogs)
    .where(
      and(
        eq(schema.setLogs.userId, userId),
        inArray(schema.setLogs.exerciseId, exerciseIds),
        lt(schema.setLogs.performedAt, before),
        ne(schema.setLogs.workoutId, excludeWorkout),
        ne(schema.setLogs.setType, "warmup"),
      ),
    )
    .groupBy(schema.setLogs.exerciseId);
  for (const r of rows) out.set(r.exerciseId, { weight: Number(r.weight), e1rm: Number(r.e1rm), volume: Number(r.volume) });
  return out;
}

async function finalize(userId: string, w: WorkoutRow, isFirstFinish: boolean): Promise<WorkoutRow> {
  const db = await getDb();
  const data = w.data;
  const resolve = await groupResolver(userId);
  const totals = workoutTotals(data);
  const groups = groupSetCounts(data, resolve);

  const exerciseIds = [...new Set(data.exercises.map((e) => e.exerciseId))];
  const prev = await previousBests(userId, exerciseIds, w.startedAt, w.id);
  const prs: PrHit[] = [];
  for (const exId of exerciseIds) {
    const working = data.exercises.filter((e) => e.exerciseId === exId).flatMap((e) => e.sets.filter(isWorkingSet));
    if (!working.length) continue;
    const bestWeight = Math.max(...working.map((s) => s.weight ?? 0));
    const bestE1rm = Math.max(...working.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0)));
    const p = prev.get(exId);
    if (!p) continue; // first time doing it is a baseline, not a record
    if (bestWeight > 0 && bestWeight > p.weight) prs.push({ exerciseId: exId, kind: "weight", value: bestWeight, previous: p.weight });
    else if (bestE1rm > 0 && bestE1rm > p.e1rm) prs.push({ exerciseId: exId, kind: "e1rm", value: bestE1rm, previous: p.e1rm });
  }

  const summary: WorkoutSummary = { ...totals, prs, groups };
  const finishedAt = isFirstFinish ? new Date() : (w.finishedAt ?? new Date());
  const durationSec = isFirstFinish
    ? Math.min(6 * 3600, Math.round((finishedAt.getTime() - w.startedAt.getTime()) / 1000))
    : w.durationSec;

  const logs: (typeof schema.setLogs.$inferInsert)[] = [];
  data.exercises.forEach((ex, ei) => {
    ex.sets.forEach((s, si) => {
      if (!s.done || !(s.reps ?? 0)) return;
      logs.push({
        id: newId(),
        userId,
        workoutId: w.id,
        exerciseId: ex.exerciseId,
        performedAt: w.startedAt,
        exerciseIndex: ei,
        setIndex: si,
        setType: s.type,
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
        e1rm: s.type === "warmup" ? 0 : e1rm(s.weight ?? 0, s.reps ?? 0),
        volume: s.type === "warmup" ? 0 : setVolume(s),
      });
    });
  });

  await db.delete(schema.setLogs).where(eq(schema.setLogs.workoutId, w.id));
  if (logs.length) await db.insert(schema.setLogs).values(logs);
  const [row] = await db
    .update(schema.workouts)
    .set({ status: "done", summary, finishedAt, durationSec })
    .where(eq(schema.workouts.id, w.id))
    .returning();
  return row;
}

export async function finishWorkout(userId: string, id: string, data?: WorkoutData): Promise<WorkoutDTO> {
  let w = await getWorkout(userId, id);
  if (data) {
    const db = await getDb();
    [w] = await db.update(schema.workouts).set({ data }).where(eq(schema.workouts.id, id)).returning();
  }
  const anyDone = w.data.exercises.some((e) => e.sets.some((s) => s.done));
  const db = await getDb();
  const cardio = await db
    .select({ id: schema.cardioLogs.id })
    .from(schema.cardioLogs)
    .where(eq(schema.cardioLogs.workoutId, id))
    .limit(1);
  if (!anyDone && !cardio.length) throw new HttpError(400, "Marque pelo menos uma série como feita antes de finalizar.");
  return toWorkoutDTO(await finalize(userId, w, w.status !== "done"));
}

export async function listWorkouts(userId: string, limit = 30, before?: string): Promise<WorkoutDTO[]> {
  const db = await getDb();
  const conds = [eq(schema.workouts.userId, userId), eq(schema.workouts.status, "done")];
  if (before) conds.push(lt(schema.workouts.startedAt, new Date(before)));
  const rows = await db
    .select()
    .from(schema.workouts)
    .where(and(...conds))
    .orderBy(desc(schema.workouts.startedAt))
    .limit(limit);
  return rows.map(toWorkoutDTO);
}

/** Sets from the most recent session of each exercise, used as "last time" hints while logging. */
export async function lastPerformance(userId: string, exerciseIds: string[], excludeWorkout?: string) {
  const out: Record<string, { date: string; sets: { weight: number; reps: number; type: string }[] }> = {};
  if (!exerciseIds.length) return out;
  const db = await getDb();
  const conds = [eq(schema.setLogs.userId, userId), inArray(schema.setLogs.exerciseId, exerciseIds)];
  if (excludeWorkout) conds.push(ne(schema.setLogs.workoutId, excludeWorkout));
  const rows = await db
    .select()
    .from(schema.setLogs)
    .where(and(...conds))
    .orderBy(desc(schema.setLogs.performedAt), schema.setLogs.exerciseIndex, schema.setLogs.setIndex)
    .limit(Math.min(2000, exerciseIds.length * 60));
  const latestWorkout = new Map<string, string>();
  for (const r of rows) {
    if (!latestWorkout.has(r.exerciseId)) latestWorkout.set(r.exerciseId, r.workoutId);
    if (latestWorkout.get(r.exerciseId) !== r.workoutId) continue;
    const entry = (out[r.exerciseId] ??= { date: r.performedAt.toISOString(), sets: [] });
    entry.sets.push({ weight: r.weight, reps: r.reps, type: r.setType });
  }
  return out;
}
