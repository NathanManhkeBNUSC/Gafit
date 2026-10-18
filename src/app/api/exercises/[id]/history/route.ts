import { requireUser, route } from "@/lib/http";
import { exerciseProgress } from "@/lib/server/progress";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  return Response.json({ progress: await exerciseProgress(user.id, (await params).id) });
});
