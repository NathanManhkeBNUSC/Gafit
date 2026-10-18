import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { HttpError } from "@/lib/http";

export type DB = NeonHttpDatabase<typeof schema>;

const url = process.env.DATABASE_URL;

declare global {
  var __gafitDb: Promise<DB> | undefined;
}

/**
 * Production uses Neon over HTTP. For local development without Postgres you can set
 * DATABASE_URL=pglite:./.data/pglite to use an embedded Postgres (PGlite); migrations
 * are applied automatically in that mode.
 */
async function create(): Promise<DB> {
  if (!url)
    throw new HttpError(500, "Configuração do servidor incompleta: DATABASE_URL não configurada. Adicione no .env.local (ou nas variáveis da Vercel) e reinicie o servidor.");
  if (url.startsWith("pglite:")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const client = new PGlite(url.slice("pglite:".length));
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    return db as unknown as DB;
  }
  return drizzleNeon(neon(url), { schema });
}

export function getDb(): Promise<DB> {
  if (!globalThis.__gafitDb) {
    globalThis.__gafitDb = create();
    // Don't cache a failed setup: fixing the env and retrying should work without a restart.
    globalThis.__gafitDb.catch(() => (globalThis.__gafitDb = undefined));
  }
  return globalThis.__gafitDb;
}

export { schema };
