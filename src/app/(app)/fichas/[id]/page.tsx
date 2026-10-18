"use client";
import { use } from "react";
import { PlanEditorPage } from "@/components/app/plan-editor-page";
import { Skeleton } from "@/components/ui/misc";
import { usePlan } from "@/lib/client/hooks";

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = usePlan(id);
  if (isLoading) return <Skeleton className="mt-16 h-96 rounded-lg" />;
  if (error || !data) return <p className="mt-16 text-center text-text-2">{error?.message ?? "Ficha não encontrada."}</p>;
  return (
    <PlanEditorPage
      key={data.updatedAt}
      planId={data.id}
      isActive={data.isActive}
      title="Editar ficha"
      initial={{ name: data.name, notes: data.notes ?? "", days: data.days.map((d) => ({ ...d, focus: d.focus ?? "" })) }}
    />
  );
}
