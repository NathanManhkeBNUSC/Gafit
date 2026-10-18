import { requireUser, route } from "@/lib/http";
import { sharePlan } from "@/lib/server/plans";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const code = await sharePlan(user.id, (await params).id);
  return Response.json({ code });
});
