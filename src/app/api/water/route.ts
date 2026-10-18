import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { parseBody, requireUser, route } from "@/lib/http";
import { newId } from "@/lib/ids";
import { waterDay } from "@/lib/server/water";

const dayRe = /^\d{4}-\d{2}-\d{2}$/;

export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const day = url.searchParams.get("day") ?? "";
  const tz = Number(url.searchParams.get("tz") ?? 180);
  return Response.json(await waterDay(user, dayRe.test(day) ? day : new Date().toISOString().slice(0, 10), Number.isFinite(tz) ? tz : 180));
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(
    req,
    z.object({
      day: z.string().regex(dayRe, "Data inválida."),
      amountMl: z.number().int().min(10, "Quantidade inválida.").max(3000, "No máximo 3 L de uma vez."),
    }),
  );
  const db = await getDb();
  const [row] = await db
    .insert(schema.waterLogs)
    .values({ id: newId(), userId: user.id, day: input.day, amountMl: input.amountMl })
    .returning();
  return Response.json({ entry: { id: row.id, amountMl: row.amountMl, createdAt: row.createdAt.toISOString() } });
});
