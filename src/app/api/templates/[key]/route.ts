import { HttpError, requireUser, route } from "@/lib/http";
import { shortId } from "@/lib/ids";
import { createPlan } from "@/lib/server/plans";
import { TEMPLATES, templateDays } from "@/lib/templates";

export const POST = route<{ params: Promise<{ key: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const { key } = await params;
  const t = TEMPLATES.find((x) => x.key === key);
  if (!t) throw new HttpError(404, "Modelo não encontrado.");
  const plan = await createPlan(user.id, {
    name: t.name,
    notes: t.description,
    days: templateDays(t, shortId),
    source: "template",
    activate: true,
  });
  return Response.json({ plan });
});
