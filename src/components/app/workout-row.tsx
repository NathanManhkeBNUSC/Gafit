"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDuration, formatVolume } from "@/lib/training";
import type { WorkoutDTO } from "@/lib/types";

export function WorkoutRow({ w }: { w: WorkoutDTO }) {
  const date = new Date(w.startedAt);
  return (
    <Link href={`/historico/${w.id}`} className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-2">
      <div className="flex w-11 shrink-0 flex-col items-center leading-none">
        <span className="font-display tabular text-xl font-bold">{date.getDate()}</span>
        <span className="mt-1 text-[11px] font-semibold uppercase text-text-3">{date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{w.name}</p>
        <p className="mt-0.5 text-sm text-text-3">
          {formatDuration(w.durationSec)} · {w.summary?.sets ?? 0} séries · {formatVolume(w.summary?.volume ?? 0)}
        </p>
      </div>
      {(w.summary?.prs.length ?? 0) > 0 && (
        <span className="rounded-full bg-peach-soft px-2 py-0.5 text-xs font-bold text-peach">{w.summary!.prs.length} PR</span>
      )}
      <ChevronRight className="size-5 text-text-3" aria-hidden />
    </Link>
  );
}

