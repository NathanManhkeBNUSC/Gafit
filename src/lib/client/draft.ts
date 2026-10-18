"use client";
import { shortId } from "@/lib/ids";
import type { DraftPlan } from "@/lib/types";
import type { EditorState } from "@/components/app/plan-editor";

export const DRAFT_KEY = "gafit-import-draft";

export function saveDraft(d: DraftPlan, source: "text" | "image") {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, source }));
}

export function loadDraft(): { state: EditorState; source: "text" | "image" } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as DraftPlan & { source?: "text" | "image" };
    if (!d.days?.length) return null;
    return {
      source: d.source ?? "text",
      state: {
        name: d.name,
        notes: d.notes ?? "",
        days: d.days.map((day) => ({
          id: shortId(),
          name: day.name,
          focus: day.focus ?? "",
          exercises: day.exercises.map((e) => ({
            id: shortId(),
            exerciseId: e.exerciseId ?? "",
            rawName: e.rawName,
            candidates: e.candidates,
            sets: e.sets,
            reps: e.reps,
            restSec: e.restSec,
            weight: e.weight ?? null,
            notes: e.notes ?? null,
          })),
        })),
      },
    };
  } catch {
    return null;
  }
}
