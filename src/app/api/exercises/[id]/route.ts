import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { HttpError, requireUser, route } from "@/lib/http";
import { catalogRecord, getCustomExercise, toCatalogExercise } from "@/lib/catalog";
import { aiEnabled, aiTranslateSteps } from "@/lib/server/ai";
import type { ExerciseDetail, MuscleGroup } from "@/lib/types";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const rec = catalogRecord(id);
  if (!rec) {
    const c = await getCustomExercise(user.id, id);
    if (!c) throw new HttpError(404, "Exercício não encontrado.");
    const detail: ExerciseDetail = {
      id: c.id,
      name: c.name,
      nameEn: "",
      group: c.group as MuscleGroup,
      equipmentKey: "outros",
      equipment: c.equipment ?? "",
      target: "",
      secondary: [],
      custom: true,
      videoUrl: c.videoUrl,
      gif: null,
      secondaryMuscles: [],
      instructions: [],
      instructionsLang: "pt",
      notes: c.notes,
    };
    return Response.json({ exercise: detail });
  }
  const db = await getDb();
  let steps = rec.instructionsEn;
  let lang: "pt" | "en" = "en";
  const [cached] = await db
    .select()
    .from(schema.exerciseTranslations)
    .where(and(eq(schema.exerciseTranslations.exerciseId, id), eq(schema.exerciseTranslations.lang, "pt")))
    .limit(1);
  if (cached) {
    steps = cached.steps;
    lang = "pt";
  } else if (aiEnabled() && steps.length) {
    try {
      steps = await aiTranslateSteps(rec.name, rec.instructionsEn);
      lang = "pt";
      await db.insert(schema.exerciseTranslations).values({ exerciseId: id, lang: "pt", steps }).onConflictDoNothing();
    } catch (e) {
      console.error("translation failed", e);
      steps = rec.instructionsEn;
    }
  }
  const detail: ExerciseDetail = {
    ...toCatalogExercise(rec),
    gif: rec.gif,
    secondaryMuscles: rec.secondaryMuscles,
    instructions: steps,
    instructionsLang: lang,
  };
  return Response.json({ exercise: detail });
});
