import { parseBody, requireUser, route } from "@/lib/http";
import { deletePlan, getPlan, toPlanDTO, updatePlan } from "@/lib/server/plans";
import { planInputSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return Response.json({ plan: toPlanDTO(await getPlan(user.id, id)) });
});

export const PUT = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseBody(req, planInputSchema);
  return Response.json({ plan: await updatePlan(user.id, id, input) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deletePlan(user.id, id);
  return Response.json({ ok: true });
});
