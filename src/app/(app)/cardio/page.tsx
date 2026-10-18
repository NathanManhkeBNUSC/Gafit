"use client";
import { useState } from "react";
import { HeartPulse, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { CardioForm } from "@/components/app/cardio-form";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCardio, useInvalidate } from "@/lib/client/hooks";
import { cardioLabel } from "@/lib/muscles";
import { formatKg } from "@/lib/training";

export default function CardioPage() {
  const { data, isLoading } = useCardio();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<string | null>(null);
  const invalidate = useInvalidate();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const totalMin = (data ?? []).filter((c) => now - new Date(c.performedAt).getTime() < 7 * 864e5).reduce((a, c) => a + c.durationMin, 0);

  return (
    <div>
      <PageHeader title="Cardio" back="/progresso" subtitle={data ? `${Math.round(totalMin)} min nos últimos 7 dias` : undefined} />
      <Button size="lg" block icon={<Plus className="size-5" />} onClick={() => setOpen(true)}>
        Registrar cardio
      </Button>
      <div className="mt-6">
        {isLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : !data?.length ? (
          <EmptyState icon={<HeartPulse className="size-6" />} title="Nenhum cardio ainda">
            Esteira, bike, escada, corrida… Registre aqui ou durante o treino.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg bg-surface p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac-soft text-lilac">
                  <HeartPulse className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {cardioLabel(c.kind)}
                    {c.intensity && <Badge tone={c.intensity === "intenso" ? "peach" : c.intensity === "leve" ? "mint" : "lilac"}>{c.intensity}</Badge>}
                  </p>
                  <p className="tabular text-sm text-text-3">
                    {new Date(c.performedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} · {c.durationMin} min
                    {c.distanceKm ? ` · ${formatKg(c.distanceKm, 2)} km` : ""}
                    {c.calories ? ` · ${c.calories} kcal` : ""}
                  </p>
                </div>
                <IconButton label="Excluir registro" onClick={() => setDel(c.id)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Registrar cardio">
        <CardioForm
          onSaved={async () => {
            setOpen(false);
            await invalidate(qk.cardio, qk.progress);
          }}
        />
      </Sheet>
      <ConfirmSheet
        open={Boolean(del)}
        onClose={() => setDel(null)}
        title="Excluir este cardio?"
        message="O registro sai do histórico e dos gráficos."
        confirmLabel="Excluir"
        danger
        onConfirm={async () => {
          try {
            await api(`/api/cardio/${del}`, { method: "DELETE" });
            await invalidate(qk.cardio, qk.progress);
            setDel(null);
          } catch (e) {
            toast(errorMessage(e), { tone: "error" });
          }
        }}
      />
    </div>
  );
}
