import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashPassword, toUserDTO, verifyPassword } from "@/lib/auth";
import { HttpError, parseBody, requireUser, route } from "@/lib/http";
import { aiEnabled } from "@/lib/server/ai";

export const GET = route(async () => {
  const user = await requireUser();
  return Response.json({ user, features: { ai: aiEnabled() } });
});

const patch = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  weeklyGoal: z.number().int().min(1).max(7).optional(),
  restDefaultSec: z.number().int().min(15).max(600).optional(),
  heightCm: z.number().int().min(100, "Altura inválida.").max(250, "Altura inválida.").nullable().optional(),
  birthYear: z.number().int().min(1920, "Ano inválido.").max(new Date().getFullYear() - 10, "Ano inválido.").nullable().optional(),
  hotClimate: z.boolean().optional(),
  cupMl: z.number().int().min(50).max(2000).optional(),
  waterGoalMl: z.number().int().min(500, "Meta mínima de 500 ml.").max(8000, "Meta máxima de 8 L.").nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "A nova senha precisa de pelo menos 6 caracteres.").max(200).optional(),
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, patch);
  const db = await getDb();
  const values: Partial<typeof schema.users.$inferInsert> = {};
  if (input.name) values.name = input.name;
  if (input.weeklyGoal) values.weeklyGoal = input.weeklyGoal;
  if (input.restDefaultSec) values.restDefaultSec = input.restDefaultSec;
  if (input.heightCm !== undefined) values.heightCm = input.heightCm;
  if (input.birthYear !== undefined) values.birthYear = input.birthYear;
  if (input.hotClimate !== undefined) values.hotClimate = input.hotClimate;
  if (input.cupMl !== undefined) values.cupMl = input.cupMl;
  if (input.waterGoalMl !== undefined) values.waterGoalMl = input.waterGoalMl;
  if (input.newPassword) {
    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    if (!input.currentPassword || !(await verifyPassword(input.currentPassword, row.passwordHash)))
      throw new HttpError(400, "A senha atual está incorreta.");
    values.passwordHash = await hashPassword(input.newPassword);
  }
  const [row] = await db.update(schema.users).set(values).where(eq(schema.users.id, user.id)).returning();
  return Response.json({ user: toUserDTO(row) });
});
