import { requireUser, route } from "@/lib/http";
import { nextPlanDay } from "@/lib/server/workouts";

export const GET = route(async () => {
  const user = await requireUser();
  return Response.json({ next: await nextPlanDay(user.id) });
});
