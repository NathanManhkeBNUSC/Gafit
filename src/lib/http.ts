import "server-only";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser } from "@/lib/auth";
import type { UserDTO } from "@/lib/types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<UserDTO> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sua sessão expirou. Entre de novo.");
  return user;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Corpo da requisição inválido.");
  }
  return schema.parse(raw);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with uniform JSON error responses. */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        const first = e.issues[0];
        return Response.json({ error: first?.message ?? "Dados inválidos.", issues: e.issues }, { status: 400 });
      }
      console.error(e);
      return Response.json({ error: "Algo deu errado no servidor. Tente de novo." }, { status: 500 });
    }
  };
}
