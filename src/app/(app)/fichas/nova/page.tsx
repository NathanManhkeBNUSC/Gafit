"use client";
import { useMemo } from "react";
import { PlanEditorPage } from "@/components/app/plan-editor-page";
import { newDay, type EditorState } from "@/components/app/plan-editor";
import { Skeleton } from "@/components/ui/misc";
import { loadDraft } from "@/lib/client/draft";
import { useMounted, useQueryFlag } from "@/lib/client/use-client";

export default function NewPlanPage() {
  const mounted = useMounted();
  const fromImport = useQueryFlag("rascunho");
  const init = useMemo<{ state: EditorState; source: "manual" | "text" | "image" } | null>(() => {
    if (!mounted) return null;
    const draft = fromImport ? loadDraft() : null;
    return draft ?? { state: { name: "", notes: "", days: [newDay(0), newDay(1), newDay(2)] }, source: "manual" };
  }, [mounted, fromImport]);
  if (!init) return <Skeleton className="mt-16 h-96 rounded-lg" />;
  return <PlanEditorPage key={init.source} initial={init.state} source={init.source} title={init.source === "manual" ? "Nova ficha" : "Revise a ficha"} />;
}
