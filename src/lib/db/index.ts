import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

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
  if (!url) throw new Error("DATABASE_URL não configurada. Veja o README.");
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
  if (!globalThis.__gafitDb) globalThis.__gafitDb = create();
  return globalThis.__gafitDb;
}

export { schema };
