import { requireUser, route } from "@/lib/http";
import { activatePlan } from "@/lib/server/plans";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  await activatePlan(user.id, (await params).id);
  return Response.json({ ok: true });
});
