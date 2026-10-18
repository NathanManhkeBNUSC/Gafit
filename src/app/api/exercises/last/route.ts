import { requireUser, route } from "@/lib/http";
import { lastPerformance } from "@/lib/server/workouts";

export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const ids = (url.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 60);
  const exclude = url.searchParams.get("exclude") ?? undefined;
  return Response.json({ last: await lastPerformance(user.id, ids, exclude) });
});
