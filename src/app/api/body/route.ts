import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { parseBody, requireUser, route } from "@/lib/http";
import { newId } from "@/lib/ids";

export const GET = route(async () => {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db.select().from(schema.bodyMetrics).where(eq(schema.bodyMetrics.userId, user.id)).orderBy(asc(schema.bodyMetrics.day));
  return Response.json({ entries: rows.map((r) => ({ id: r.id, day: String(r.day), weightKg: r.weightKg, notes: r.notes })) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(
    req,
    z.object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
      weightKg: z.number().min(20, "Peso inválido.").max(400, "Peso inválido."),
      notes: z.string().max(200).nullish(),
    }),
  );
  const db = await getDb();
  const [row] = await db
    .insert(schema.bodyMetrics)
    .values({ id: newId(), userId: user.id, day: input.day, weightKg: input.weightKg, notes: input.notes ?? null })
    .onConflictDoUpdate({
      target: [schema.bodyMetrics.userId, schema.bodyMetrics.day],
      set: { weightKg: input.weightKg, notes: input.notes ?? null },
    })
    .returning();
  return Response.json({ entry: { id: row.id, day: String(row.day), weightKg: row.weightKg, notes: row.notes } });
});
