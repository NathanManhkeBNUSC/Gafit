import { z } from "zod";
import { parseBody, requireUser, route } from "@/lib/http";
import { listWorkouts, startWorkout } from "@/lib/server/workouts";

export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? 30));
  const before = url.searchParams.get("before") ?? undefined;
  return Response.json({ workouts: await listWorkouts(user.id, limit, before) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(
    req,
    z.object({ planId: z.string().nullish(), dayId: z.string().nullish(), name: z.string().max(80).nullish() }),
  );
  return Response.json({ workout: await startWorkout(user.id, input) });
});
