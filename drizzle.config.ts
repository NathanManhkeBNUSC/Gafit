import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read .env.local on its own; load it the same way Next.js does.
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL ?? "";
if (!url || url.startsWith("pglite:")) {
  throw new Error(
    "Coloque a connection string do Neon em DATABASE_URL no .env.local para rodar as migrações. " +
      "(O modo pglite: cria as tabelas sozinho ao rodar `npm run dev`, não precisa migrar.)",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
