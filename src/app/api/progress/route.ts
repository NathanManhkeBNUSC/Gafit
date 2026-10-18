import { requireUser, route } from "@/lib/http";
import { progressSummary } from "@/lib/server/progress";

export const GET = route(async (req) => {
  const user = await requireUser();
  const tz = Number(new URL(req.url).searchParams.get("tz") ?? 180);
  return Response.json({ summary: await progressSummary(user.id, user.weeklyGoal, Number.isFinite(tz) ? tz : 180) });
});
