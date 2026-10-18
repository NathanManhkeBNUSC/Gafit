import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { HttpError, parseBody, requireUser, route } from "@/lib/http";
import { newId } from "@/lib/ids";
import { cloneDays, createPlan, findSharedPlan } from "@/lib/server/plans";

export const POST = route(async (req) => {
  const user = await requireUser();
  const { code, activate } = await parseBody(req, z.object({ code: z.string().min(4).max(12), activate: z.boolean().optional() }));
  const found = await findSharedPlan(code);
  if (!found) throw new HttpError(404, "Nenhuma ficha com esse código.");
  let days = cloneDays(found.plan.days);

  // The friend's own exercises come along as copies owned by this user.
  const customIds = [...new Set(days.flatMap((d) => d.exercises.map((e) => e.exerciseId)).filter((id) => id.startsWith("c_")))];
  if (customIds.length && found.plan.userId !== user.id) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.customExercises)
      .where(and(eq(schema.customExercises.userId, found.plan.userId), inArray(schema.customExercises.id, customIds)));
    const map = new Map<string, string>();
    if (rows.length) {
      const copies = rows.map((r) => {
        const id = `c_${newId()}`;
        map.set(r.id, id);
        return { id, userId: user.id, name: r.name, group: r.group, equipment: r.equipment, videoUrl: r.videoUrl, notes: r.notes };
      });
      await db.insert(schema.customExercises).values(copies);
    }
    days = days.map((d) => ({
      ...d,
      exercises: d.exercises.filter((e) => !e.exerciseId.startsWith("c_") || map.has(e.exerciseId)).map((e) => ({ ...e, exerciseId: map.get(e.exerciseId) ?? e.exerciseId })),
    }));
  }

  const plan = await createPlan(user.id, {
    name: found.plan.userId === user.id ? `${found.plan.name} (cópia)` : found.plan.name,
    notes: [found.plan.notes, `Compartilhada por ${found.ownerName}`].filter(Boolean).join("\n"),
    days,
    source: "shared",
    activate,
  });
  return Response.json({ plan });
});
