import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { parseBody, requireUser, route } from "@/lib/http";
import { discardWorkout, getWorkout, toWorkoutDTO, updateWorkout } from "@/lib/server/workouts";
import { workoutUpdateSchema } from "@/lib/validators";
import type { WorkoutData } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const w = await getWorkout(user.id, id);
  const db = await getDb();
  const cardio = await db.select().from(schema.cardioLogs).where(eq(schema.cardioLogs.workoutId, id));
  return Response.json({
    workout: toWorkoutDTO(w),
    cardio: cardio.map((c) => ({ ...c, performedAt: c.performedAt.toISOString() })),
  });
});

export const PUT = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseBody(req, workoutUpdateSchema);
  return Response.json({ workout: await updateWorkout(user.id, id, { ...input, data: input.data as WorkoutData | undefined }) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  await discardWorkout(user.id, (await params).id);
  return Response.json({ ok: true });
});
