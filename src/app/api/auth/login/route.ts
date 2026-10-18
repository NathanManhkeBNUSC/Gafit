import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { assertAuthConfigured, createSession, toUserDTO, verifyPassword } from "@/lib/auth";
import { HttpError, parseBody, route } from "@/lib/http";

const body = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Digite a senha."),
});

export const POST = route(async (req) => {
  assertAuthConfigured();
  const input = await parseBody(req, body);
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, input.email)).limit(1);
  if (!user || !(await verifyPassword(input.password, user.passwordHash)))
    throw new HttpError(401, "E-mail ou senha incorretos.");
  await createSession(user.id);
  return Response.json({ user: toUserDTO(user) });
});
