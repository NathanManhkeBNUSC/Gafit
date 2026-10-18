"use client";
import { useState } from "react";
import { Dumbbell, Timer } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { DayBadge, EmptyState, Skeleton, dayLetter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useInvalidate, useNextDay, usePlans } from "@/lib/client/hooks";
import { estimateDayMinutes } from "@/lib/training";

export function SessionChooser() {
  const plans = usePlans();
  const next = useNextDay();
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const invalidate = useInvalidate();
  const active = plans.data?.find((p) => p.isActive);
  const others = plans.data?.filter((p) => !p.isActive) ?? [];

  async function start(key: string, body: { planId?: string; dayId?: string; name?: string }) {
    setBusy(key);
    try {
      await api("/api/workouts", { method: "POST", json: body });
      await invalidate(qk.active);
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Treinar" subtitle="Escolha o treino de hoje." />
      {plans.isLoading ? (
        <Skeleton className="h-72 rounded-lg" />
      ) : !active ? (
        <EmptyState
          icon={<Dumbbell className="size-6" />}
          title="Você ainda não tem ficha"
          action={<Button href="/fichas?bemvindo=1">Adicionar ficha</Button>}
        >
          Traga sua ficha para treinar com ela, ou comece um treino livre abaixo.
        </EmptyState>
      ) : (
        <>
          <p className="mb-2 px-1 text-sm font-semibold text-text-3">{active.name}</p>
          <div className="flex flex-col gap-2">
            {active.days.map((d, i) => {
              const isNext = next.data?.day.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={Boolean(busy) || d.exercises.length === 0}
                  onClick={() => start(d.id, { planId: active.id, dayId: d.id })}
                  className={cn(
                    "flex items-center gap-4 rounded-lg p-4 text-left transition-colors disabled:opacity-50",
                    isNext ? "bg-surface-3 ring-2 ring-rose-line" : "bg-surface hover:bg-surface-2",
                  )}
                >
                  <DayBadge index={i} label={dayLetter(d.name, i)} size="lg" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-lg font-bold">{d.name}</span>
                      {isNext && <Badge tone="rose">Próximo</Badge>}
                    </span>
                    {d.focus && <span className="block truncate text-sm text-text-2">{d.focus}</span>}
                    <span className="mt-0.5 flex items-center gap-3 text-xs text-text-3">
                      <span>{d.exercises.length} exercícios</span>
                      {d.exercises.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Timer className="size-3" /> ~{estimateDayMinutes(d.exercises)} min
                        </span>
                      )}
                    </span>
                  </span>
                  {busy === d.id && <span className="text-sm text-text-3">Abrindo…</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {others.length > 0 && (
        <details className="mt-6 rounded-lg bg-surface">
          <summary className="cursor-pointer list-none p-4 font-semibold">Outras fichas</summary>
          <div className="flex flex-col gap-1 px-2 pb-2">
            {others.flatMap((p) =>
              p.days.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={Boolean(busy) || !d.exercises.length}
                  onClick={() => start(d.id, { planId: p.id, dayId: d.id })}
                  className="flex items-center gap-3 rounded-md p-2 text-left hover:bg-surface-2 disabled:opacity-50"
                >
                  <DayBadge index={i} label={dayLetter(d.name, i)} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-semibold">{d.name}</span>
                    <span className="text-text-3"> · {p.name}</span>
                  </span>
                </button>
              )),
            )}
          </div>
        </details>
      )}

      <Button
        variant="outline"
        size="lg"
        block
        className="mt-6"
        loading={busy === "free"}
        onClick={() => start("free", { name: "Treino livre" })}
      >
        Treino livre
      </Button>
      <p className="mt-2 text-center text-xs text-text-3">Sem ficha: adicione exercícios enquanto treina.</p>
    </div>
  );
}
