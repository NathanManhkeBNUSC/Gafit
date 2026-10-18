import "server-only";
import { catalogSearch } from "@/lib/catalog";
import { parsePlanText } from "@/lib/parse-plan";
import type { DraftDay, DraftExercise, DraftPlan } from "@/lib/types";
import { aiEnabled, aiReadPlan, type AiPlan } from "./ai";

function match(names: string[]): { exerciseId: string | null; candidates: string[] } {
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const n of names) {
    if (!n?.trim()) continue;
    for (const c of catalogSearch(n, 5)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        candidates.push(c.id);
      }
    }
  }
  return { exerciseId: candidates[0] ?? null, candidates: candidates.slice(0, 6) };
}

function fromAi(plan: AiPlan): DraftPlan {
  const warnings: string[] = [];
  const days: DraftDay[] = plan.days
    .filter((d) => d.exercises?.length)
    .map((d, i) => ({
      name: d.name?.trim() || `Treino ${String.fromCharCode(65 + i)}`,
      focus: d.focus?.trim() || null,
      exercises: d.exercises.map((e): DraftExercise => {
        const m = match([e.name_pt, e.name_en ?? ""]);
        if (!m.exerciseId) warnings.push(`Não achei "${e.name_pt}" na biblioteca. Escolha um equivalente.`);
        return {
          ...m,
          rawName: e.name_pt,
          sets: Math.max(1, Math.min(20, Math.round(e.sets ?? 3))),
          reps: String(e.reps ?? "").slice(0, 40),
          restSec: Math.max(0, Math.min(900, Math.round(e.rest_sec ?? 60))),
          weight: e.weight_kg ?? null,
          notes: [e.notes, e.superset ? `bi-set ${e.superset}` : ""].filter(Boolean).join(" · ") || null,
        };
      }),
    }));
  return { name: plan.name?.trim() || "Minha ficha", notes: plan.notes || null, days, warnings, usedAi: true };
}

export async function importFromText(text: string, preferAi: boolean): Promise<DraftPlan> {
  if (preferAi && aiEnabled()) return fromAi(await aiReadPlan({ text }));
  const parsed = parsePlanText(text);
  const warnings = [...parsed.warnings];
  const days: DraftDay[] = parsed.days.map((d) => ({
    name: d.name,
    focus: d.focus,
    exercises: d.exercises.map((e): DraftExercise => {
      const m = match([e.name]);
      if (!m.exerciseId) warnings.push(`Não achei "${e.name}" na biblioteca. Escolha um equivalente.`);
      return {
        ...m,
        rawName: e.name,
        sets: e.sets,
        reps: e.reps,
        restSec: e.restSec ?? 60,
        weight: e.weight,
        notes: [e.notes, e.superset ? `bi-set ${e.superset}` : ""].filter(Boolean).join(" · ") || null,
      };
    }),
  }));
  if (!days.length) warnings.push("Não encontrei exercícios no texto. Confira o formato: um exercício por linha, como \"Supino reto 4x10\".");
  return { name: parsed.title || "Minha ficha", notes: null, days, warnings, usedAi: false };
}

export async function importFromFiles(
  files: ({ kind: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string } | { kind: "pdf"; data: string })[],
): Promise<DraftPlan> {
  return fromAi(await aiReadPlan({ files }));
}
