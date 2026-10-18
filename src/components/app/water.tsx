"use client";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Droplet } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { localDay, qk, useMe, useWater } from "@/lib/client/hooks";
import type { WaterDayDTO } from "@/lib/server/water";
import { formatLiters } from "@/lib/water";

/** Adds a drink with an optimistic update and an undo toast. */
export function useAddWater(day: string) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function add(amountMl: number) {
    const key = qk.water(day);
    const prev = qc.getQueryData<WaterDayDTO>(key);
    const tempId = `tmp-${Date.now()}`;
    if (prev) {
      qc.setQueryData<WaterDayDTO>(key, {
        ...prev,
        totalMl: prev.totalMl + amountMl,
        entries: [{ id: tempId, amountMl, createdAt: new Date().toISOString() }, ...prev.entries],
        week: prev.week.map((w) => (w.day === day ? { ...w, totalMl: w.totalMl + amountMl } : w)),
      });
    }
    setBusy(true);
    try {
      const res = await api<{ entry: { id: string } }>("/api/water", { method: "POST", json: { day, amountMl } });
      const total = (prev?.totalMl ?? 0) + amountMl;
      const goal = prev?.goal.goalMl ?? 0;
      const reached = goal > 0 && total >= goal && (prev?.totalMl ?? 0) < goal;
      toast(reached ? "Meta de água batida!" : `+${amountMl} ml`, {
        tone: reached ? "success" : "default",
        action: {
          label: "Desfazer",
          onClick: async () => {
            await api(`/api/water/${res.entry.id}`, { method: "DELETE" }).catch(() => {});
            qc.invalidateQueries({ queryKey: key });
          },
        },
      });
    } catch (e) {
      if (prev) qc.setQueryData(key, prev);
      toast(errorMessage(e), { tone: "error" });
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: key });
    }
  }
  return { add, busy };
}

export function QuickAdd({ day, cupMl, sizes, className }: { day: string; cupMl: number; sizes?: number[]; className?: string }) {
  const { add } = useAddWater(day);
  const amounts = sizes ?? [...new Set([cupMl, 500])].sort((a, b) => a - b);
  return (
    <div className={cn("flex gap-2", className)}>
      {amounts.map((ml) => (
        <button
          key={ml}
          type="button"
          onClick={() => add(ml)}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-water-soft text-sm font-bold text-water transition-transform active:scale-95"
          aria-label={`Adicionar ${ml} ml de água`}
        >
          <Droplet className="size-4" aria-hidden /> +{ml} ml
        </button>
      ))}
    </div>
  );
}

/** Home card: today's water vs goal with quick-add. */
export function WaterCard() {
  const day = localDay();
  const { data, isLoading } = useWater(day);
  const { data: me } = useMe();
  if (isLoading || !data || !me) return <Skeleton className="h-36 rounded-lg" />;
  const pct = Math.min(100, (data.totalMl / data.goal.goalMl) * 100);
  const done = data.totalMl >= data.goal.goalMl;
  return (
    <div className="rounded-lg bg-surface p-4">
      <Link href="/agua" className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-water-soft text-water">
          <Droplet className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display tabular block text-xl font-bold">
            {formatLiters(data.totalMl)} <span className="text-base font-semibold text-text-3">de {formatLiters(data.goal.goalMl)}</span>
          </span>
          <span className="block text-xs text-text-3">
            {done ? "Meta de hoje batida" : `Faltam ${formatLiters(data.goal.goalMl - data.totalMl)}`}
            {data.goal.missing.includes("peso") && !data.goal.manual ? " · informe seu peso para ajustar" : ""}
          </span>
        </span>
        <ChevronRight className="size-5 text-text-3" aria-hidden />
      </Link>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Água bebida hoje em relação à meta">
        <div className="h-full rounded-full bg-water transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <QuickAdd day={day} cupMl={me.user.cupMl} className="mt-3" />
    </div>
  );
}
