import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import type { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { newId, newShareCode, shortId } from "@/lib/ids";
import type { PlanDTO, PlanDay } from "@/lib/types";
import type { planInputSchema } from "@/lib/validators";

type PlanRow = typeof schema.plans.$inferSelect;
export type PlanInput = z.infer<typeof planInputSchema>;

export function toPlanDTO(p: PlanRow): PlanDTO {
  return {
    id: p.id,
    name: p.name,
    notes: p.notes,
    days: p.days,
    isActive: p.isActive,
    source: p.source,
    shareCode: p.shareCode,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function listPlans(userId: string): Promise<PlanDTO[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.userId, userId))
    .orderBy(desc(schema.plans.isActive), desc(schema.plans.updatedAt));
  return rows.map(toPlanDTO);
}

export async function getPlan(userId: string, id: string): Promise<PlanRow> {
  const db = await getDb();
  const [p] = await db
    .select()
    .from(schema.plans)
    .where(and(eq(schema.plans.userId, userId), eq(schema.plans.id, id)))
    .limit(1);
  if (!p) throw new HttpError(404, "Ficha não encontrada.");
  return p;
}

export async function getActivePlan(userId: string): Promise<PlanRow | null> {
  const db = await getDb();
  const [p] = await db
    .select()
    .from(schema.plans)
    .where(and(eq(schema.plans.userId, userId), eq(schema.plans.isActive, true)))
    .limit(1);
  return p ?? null;
}

async function deactivateOthers(userId: string, keepId: string) {
  const db = await getDb();
  await db
    .update(schema.plans)
    .set({ isActive: false })
    .where(and(eq(schema.plans.userId, userId), ne(schema.plans.id, keepId)));
}

export async function createPlan(userId: string, input: PlanInput): Promise<PlanDTO> {
  const db = await getDb();
  const existing = await db.select({ id: schema.plans.id }).from(schema.plans).where(eq(schema.plans.userId, userId));
  const activate = input.activate ?? existing.length === 0;
  const id = newId();
  const [row] = await db
    .insert(schema.plans)
    .values({
      id,
      userId,
      name: input.name,
      notes: input.notes ?? null,
      days: input.days as PlanDay[],
      source: input.source ?? "manual",
      isActive: activate,
    })
    .returning();
  if (activate) await deactivateOthers(userId, id);
  return toPlanDTO(row);
}

export async function updatePlan(userId: string, id: string, input: PlanInput): Promise<PlanDTO> {
  await getPlan(userId, id);
  const db = await getDb();
  const [row] = await db
    .update(schema.plans)
    .set({
      name: input.name,
      notes: input.notes ?? null,
      days: input.days as PlanDay[],
      updatedAt: new Date(),
      ...(input.activate ? { isActive: true } : {}),
    })
    .where(and(eq(schema.plans.userId, userId), eq(schema.plans.id, id)))
    .returning();
  if (input.activate) await deactivateOthers(userId, id);
  return toPlanDTO(row);
}

export async function deletePlan(userId: string, id: string) {
  const plan = await getPlan(userId, id);
  const db = await getDb();
  await db.delete(schema.plans).where(and(eq(schema.plans.userId, userId), eq(schema.plans.id, id)));
  if (plan.isActive) {
    const [next] = await db
      .select({ id: schema.plans.id })
      .from(schema.plans)
      .where(eq(schema.plans.userId, userId))
      .orderBy(desc(schema.plans.updatedAt))
      .limit(1);
    if (next) await db.update(schema.plans).set({ isActive: true }).where(eq(schema.plans.id, next.id));
  }
}

export async function activatePlan(userId: string, id: string) {
  await getPlan(userId, id);
  const db = await getDb();
  await db.update(schema.plans).set({ isActive: true }).where(eq(schema.plans.id, id));
  await deactivateOthers(userId, id);
}

export async function sharePlan(userId: string, id: string): Promise<string> {
  const plan = await getPlan(userId, id);
  if (plan.shareCode) return plan.shareCode;
  const db = await getDb();
  for (let i = 0; i < 5; i++) {
    const code = newShareCode();
    try {
      await db.update(schema.plans).set({ shareCode: code }).where(eq(schema.plans.id, id));
      return code;
    } catch {
      // unique collision, try another code
    }
  }
  throw new HttpError(500, "Não foi possível gerar o código. Tente de novo.");
}

export async function findSharedPlan(code: string): Promise<{ plan: PlanRow; ownerName: string } | null> {
  const db = await getDb();
  const rows = await db
    .select({ plan: schema.plans, ownerName: schema.users.name })
    .from(schema.plans)
    .innerJoin(schema.users, eq(schema.users.id, schema.plans.userId))
    .where(eq(schema.plans.shareCode, code.trim().toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

/** Fresh ids for every day/exercise so a copy never collides with its source. */
export function cloneDays(days: PlanDay[]): PlanDay[] {
  return days.map((d) => ({
    ...d,
    id: shortId(),
    exercises: d.exercises.map((e) => ({ ...e, id: shortId() })),
  }));
}
