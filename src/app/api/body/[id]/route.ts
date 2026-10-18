import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireUser, route } from "@/lib/http";

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const db = await getDb();
  await db.delete(schema.bodyMetrics).where(and(eq(schema.bodyMetrics.userId, user.id), eq(schema.bodyMetrics.id, (await params).id)));
  return Response.json({ ok: true });
});
