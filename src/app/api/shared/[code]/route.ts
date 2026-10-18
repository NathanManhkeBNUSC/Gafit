import { HttpError, requireUser, route } from "@/lib/http";
import { findSharedPlan } from "@/lib/server/plans";

/** Preview of a friend's shared plan before copying it. */
export const GET = route<{ params: Promise<{ code: string }> }>(async (_req, { params }) => {
  await requireUser();
  const found = await findSharedPlan((await params).code);
  if (!found) throw new HttpError(404, "Nenhuma ficha com esse código.");
  return Response.json({ name: found.plan.name, notes: found.plan.notes, days: found.plan.days, ownerName: found.ownerName });
});
