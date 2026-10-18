import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { UserDTO } from "@/lib/types";

export const SESSION_COOKIE = "gafit_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET ausente ou curto demais (mínimo 16 caracteres).");
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function toUserDTO(u: typeof schema.users.$inferSelect): UserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    weeklyGoal: u.weeklyGoal,
    restDefaultSec: u.restDefaultSec,
    heightCm: u.heightCm,
    birthYear: u.birthYear,
    hotClimate: u.hotClimate,
    cupMl: u.cupMl,
    waterGoalMl: u.waterGoalMl,
  };
}

export async function getCurrentUser(): Promise<UserDTO | null> {
  const id = await readSessionUserId();
  if (!id) return null;
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return u ? toUserDTO(u) : null;
}
