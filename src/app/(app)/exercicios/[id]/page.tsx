"use client";
import { use, useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { LineChart } from "@/components/app/charts";
import { ExerciseHowTo } from "@/components/app/exercise-detail";
import { Card, Section } from "@/components/ui/card";
import { Segmented } from "@/components/ui/chip";
import { Skeleton, Stat } from "@/components/ui/misc";
import { useCatalog, useExercise, useExerciseHistory } from "@/lib/client/hooks";
import { formatKg } from "@/lib/training";

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { byId } = useCatalog();
  const ex = useExercise(id);
  const hist = useExerciseHistory(id);
  const [metric, setMetric] = useState<"bestE1rm" | "bestWeight" | "volume">("bestWeight");
  const name = ex.data?.name ?? byId.get(id)?.name ?? "";
  const sessions = hist.data?.sessions ?? [];

  return (
    <div>
      <PageHeader title={name || <Skeleton className="h-8 w-48" />} back="/exercicios" />

      <Section title="Seu histórico">
        {hist.isLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : sessions.length === 0 ? (
          <Card className="p-4 text-sm text-text-2">Você ainda não registrou este exercício. Depois do primeiro treino, a evolução aparece aqui.</Card>
        ) : (
          <>
            <Card className="grid grid-cols-3 gap-3 p-4">
              <Stat value={`${formatKg(hist.data!.records.weight)} kg`} label="maior carga" />
              <Stat value={`${formatKg(hist.data!.records.e1rm)} kg`} label="1RM estimado" />
              <Stat value={sessions.length} label={sessions.length === 1 ? "treino" : "treinos"} />
            </Card>
            {sessions.length >= 2 && (
              <Card className="mt-3 p-4">
                <Segmented
                  label="Métrica"
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "bestWeight", label: "Carga" },
                    { value: "bestE1rm", label: "1RM est." },
                    { value: "volume", label: "Volume" },
                  ]}
                />
                <div className="mt-4">
                  <LineChart
                    label={`Evolução de ${name}`}
                    unit=" kg"
                    data={sessions.slice(-40).map((s) => ({
                      x: new Date(s.date).toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" }),
                      y: s[metric],
                      detail: `melhor série ${formatKg(s.bestWeight)} kg × ${s.bestReps}`,
                    }))}
                  />
                </div>
              </Card>
            )}
            <ul className="mt-3 flex flex-col gap-2">
              {[...sessions].reverse().slice(0, 12).map((s) => (
                <li key={s.workoutId} className="rounded-lg bg-surface p-3">
                  <p className="text-xs font-semibold text-text-3">{new Date(s.date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="tabular mt-1 text-sm">
                    {s.sets
                      .filter((x) => x.type !== "warmup")
                      .map((x) => `${formatKg(x.weight)}×${x.reps}`)
                      .join("  ·  ")}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="Execução">
        <Card className="p-4">
          <ExerciseHowTo id={id} data={ex.data} loading={ex.isLoading} hideHistoryLink />
        </Card>
      </Section>
    </div>
  );
}
