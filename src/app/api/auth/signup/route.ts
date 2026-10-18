import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { assertAuthConfigured, createSession, hashPassword, toUserDTO } from "@/lib/auth";
import { HttpError, parseBody, route } from "@/lib/http";
import { newId } from "@/lib/ids";

const body = z.object({
  name: z.string().trim().min(2, "Digite seu nome.").max(60),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres.").max(200),
  invite: z.string().trim().max(100).optional(),
});

export const POST = route(async (req) => {
  assertAuthConfigured();
  const input = await parseBody(req, body);
  const required = process.env.INVITE_CODE?.trim();
  if (required && input.invite?.trim().toLowerCase() !== required.toLowerCase())
    throw new HttpError(403, "Código de convite incorreto. Peça para quem te chamou.");
  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, input.email)).limit(1);
  if (exists) throw new HttpError(409, "Já existe uma conta com esse e-mail. Tente entrar.");
  const [user] = await db
    .insert(schema.users)
    .values({ id: newId(), name: input.name, email: input.email, passwordHash: await hashPassword(input.password) })
    .returning();
  await createSession(user.id);
  return Response.json({ user: toUserDTO(user) });
});
