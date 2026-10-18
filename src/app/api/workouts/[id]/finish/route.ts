import { z } from "zod";
import { parseBody, requireUser, route } from "@/lib/http";
import { finishWorkout } from "@/lib/server/workouts";
import { workoutDataSchema } from "@/lib/validators";
import type { WorkoutData } from "@/lib/types";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { data } = await parseBody(req, z.object({ data: workoutDataSchema.optional() }));
  return Response.json({ workout: await finishWorkout(user.id, (await params).id, data as WorkoutData | undefined) });
});
