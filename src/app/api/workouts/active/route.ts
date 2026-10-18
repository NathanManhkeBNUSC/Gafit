import { requireUser, route } from "@/lib/http";
import { getActiveWorkout, toWorkoutDTO } from "@/lib/server/workouts";

export const GET = route(async () => {
  const user = await requireUser();
  const w = await getActiveWorkout(user.id);
  return Response.json({ workout: w ? toWorkoutDTO(w) : null });
});
