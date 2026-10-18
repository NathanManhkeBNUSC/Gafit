import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { HttpError, parseBody, requireUser, route } from "@/lib/http";
import { newId } from "@/lib/ids";
import { cardioInputSchema } from "@/lib/validators";

const toDTO = (c: typeof schema.cardioLogs.$inferSelect) => ({ ...c, performedAt: c.performedAt.toISOString() });

export const GET = route(async (req) => {
  const user = await requireUser();
  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") ?? 50));
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.cardioLogs)
    .where(eq(schema.cardioLogs.userId, user.id))
    .orderBy(desc(schema.cardioLogs.performedAt))
    .limit(limit);
  return Response.json({ cardio: rows.map(toDTO) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, cardioInputSchema);
  const db = await getDb();
  if (input.workoutId) {
    const [w] = await db
      .select({ id: schema.workouts.id })
      .from(schema.workouts)
      .where(and(eq(schema.workouts.id, input.workoutId), eq(schema.workouts.userId, user.id)));
    if (!w) throw new HttpError(404, "Treino não encontrado.");
  }
  const [row] = await db
    .insert(schema.cardioLogs)
    .values({
      id: newId(),
      userId: user.id,
      workoutId: input.workoutId ?? null,
      kind: input.kind,
      durationMin: input.durationMin,
      distanceKm: input.distanceKm ?? null,
      calories: input.calories ?? null,
      avgHr: input.avgHr ?? null,
      intensity: input.intensity ?? null,
      incline: input.incline ?? null,
      notes: input.notes ?? null,
      performedAt: input.performedAt ? new Date(input.performedAt) : new Date(),
    })
    .returning();
  return Response.json({ cardio: toDTO(row) });
});
