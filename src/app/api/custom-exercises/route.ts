import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { parseBody, requireUser, route } from "@/lib/http";
import { newId } from "@/lib/ids";
import { userCustomExercises } from "@/lib/catalog";

export const GET = route(async () => {
  const user = await requireUser();
  return Response.json({ exercises: await userCustomExercises(user.id) });
});

const body = z.object({
  name: z.string().trim().min(2, "Dê um nome ao exercício.").max(80),
  group: z.string().min(2).max(20),
  equipment: z.string().max(40).nullish(),
  videoUrl: z.string().url("Link inválido.").max(400).nullish().or(z.literal("")),
  notes: z.string().max(500).nullish(),
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, body);
  const db = await getDb();
  const [row] = await db
    .insert(schema.customExercises)
    .values({
      id: `c_${newId()}`,
      userId: user.id,
      name: input.name,
      group: input.group,
      equipment: input.equipment || null,
      videoUrl: input.videoUrl || null,
      notes: input.notes || null,
    })
    .returning();
  return Response.json({ exercise: { id: row.id, name: row.name, group: row.group } });
});
