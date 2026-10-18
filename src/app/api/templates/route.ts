import { requireUser, route } from "@/lib/http";
import { TEMPLATES } from "@/lib/templates";

export const GET = route(async () => {
  await requireUser();
  return Response.json({
    templates: TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      level: t.level,
      daysPerWeek: t.daysPerWeek,
      description: t.description,
      days: t.days.map((d) => ({ name: d.name, focus: d.focus, exerciseIds: d.exercises.map((e) => e[0]) })),
    })),
  });
});
