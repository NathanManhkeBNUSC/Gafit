"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useInvalidate } from "@/lib/client/hooks";
import type { PlanDTO } from "@/lib/types";
import { PlanEditor, toPlanDays, type EditorState } from "./plan-editor";

export function PlanEditorPage({
  initial,
  planId,
  source = "manual",
  title,
  isActive,
}: {
  initial: EditorState;
  planId?: string;
  source?: "manual" | "text" | "image" | "template" | "shared";
  title: string;
  isActive?: boolean;
}) {
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidate();

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const unresolved = state.days.some((d) => d.exercises.some((e) => !e.exerciseId));
  const empty = state.days.every((d) => d.exercises.length === 0);

  async function save() {
    setSaving(true);
    try {
      const body = {
        name: state.name.trim() || "Minha ficha",
        notes: state.notes.trim() || null,
        days: toPlanDays(state.days),
        source,
        activate: planId ? undefined : true,
      };
      const res = await api<{ plan: PlanDTO }>(planId ? `/api/plans/${planId}` : "/api/plans", {
        method: planId ? "PUT" : "POST",
        json: body,
      });
      setDirty(false);
      await invalidate(qk.plans, qk.next, qk.plan(res.plan.id));
      toast(planId ? "Ficha salva" : "Ficha criada e ativada", { tone: "success" });
      router.replace(`/fichas/${res.plan.id}`);
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={title} back="/fichas" subtitle={isActive ? "Ficha ativa" : undefined} />
      <PlanEditor
        value={state}
        onChange={(v) => {
          setState(v);
          setDirty(true);
        }}
      />
      <div className="fixed inset-x-0 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom))] z-30 border-t border-line bg-bg-elev/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 text-xs text-text-3">
            {unresolved
              ? "Exercícios não encontrados ficam de fora ao salvar."
              : dirty
                ? "Alterações não salvas"
                : planId
                  ? "Tudo salvo"
                  : "Revise e salve"}
          </p>
          <Button onClick={save} loading={saving} disabled={empty || (!dirty && Boolean(planId))}>
            {planId ? "Salvar" : "Salvar ficha"}
          </Button>
        </div>
      </div>
    </div>
  );
}
