import { parseBody, requireUser, route } from "@/lib/http";
import { createPlan, listPlans } from "@/lib/server/plans";
import { planInputSchema } from "@/lib/validators";

export const GET = route(async () => {
  const user = await requireUser();
  return Response.json({ plans: await listPlans(user.id) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, planInputSchema);
  return Response.json({ plan: await createPlan(user.id, input) });
});
