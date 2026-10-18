"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { WorkoutRow } from "@/components/app/workout-row";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/client/api";
import { qk } from "@/lib/client/hooks";
import type { WorkoutDTO } from "@/lib/types";

const PAGE = 25;

export default function HistoryPage() {
  const q = useInfiniteQuery({
    queryKey: [...qk.workouts, "infinite"],
    initialPageParam: "",
    queryFn: async ({ pageParam }) =>
      (await api<{ workouts: WorkoutDTO[] }>(`/api/workouts?limit=${PAGE}${pageParam ? `&before=${encodeURIComponent(pageParam)}` : ""}`)).workouts,
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1].startedAt : undefined),
  });
  const all = q.data?.pages.flat() ?? [];
  const byMonth = new Map<string, WorkoutDTO[]>();
  for (const w of all) {
    const k = new Date(w.startedAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    byMonth.set(k, [...(byMonth.get(k) ?? []), w]);
  }
  return (
    <div>
      <PageHeader title="Histórico" back="/progresso" />
      {q.isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : !all.length ? (
        <EmptyState icon={<CalendarDays className="size-6" />} title="Nenhum treino finalizado" action={<Button href="/treino">Treinar agora</Button>}>
          Seus treinos aparecem aqui assim que você finalizar o primeiro.
        </EmptyState>
      ) : (
        <>
          {[...byMonth].map(([month, ws]) => (
            <section key={month} className="mb-6">
              <h2 className="mb-2 px-1 text-sm font-bold capitalize text-text-2">
                {month} · {ws.length} {ws.length === 1 ? "treino" : "treinos"}
              </h2>
              <div className="flex flex-col gap-2">
                {ws.map((w) => (
                  <WorkoutRow key={w.id} w={w} />
                ))}
              </div>
            </section>
          ))}
          {q.hasNextPage && (
            <Button variant="secondary" block loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
              Carregar mais
            </Button>
          )}
        </>
      )}
    </div>
  );
}
