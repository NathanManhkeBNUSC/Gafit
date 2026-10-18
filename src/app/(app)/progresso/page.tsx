"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, HeartPulse, History, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { BarList, ColumnChart, LineChart } from "@/components/app/charts";
import { ExerciseThumb } from "@/components/app/exercise-thumb";
import { RecoveryList } from "@/components/app/recovery";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/chip";
import { Card, Section } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCatalog, useInvalidate, useProgress } from "@/lib/client/hooks";
import { GROUP_LABEL, TRAINABLE_GROUPS } from "@/lib/muscles";
import { formatKg, formatVolume } from "@/lib/training";

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}`;
};

export default function ProgressPage() {
  const { data: p, isLoading } = useProgress();
  const { byId } = useCatalog();
  const [metric, setMetric] = useState<"workouts" | "volume" | "cardioMin">("workouts");

  return (
    <div>
      <PageHeader
        title="Progresso"
        actions={
          <>
            <Link href="/historico" className="flex h-10 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-semibold text-text-2 hover:text-text">
              <History className="size-4" /> Histórico
            </Link>
          </>
        }
      />
      {isLoading || !p ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
      ) : (
        <>
          <p className="px-1 text-base leading-relaxed text-text-2">
            Nos últimos 30 dias: <strong className="text-text">{p.last30.workouts} {p.last30.workouts === 1 ? "treino" : "treinos"}</strong>,{" "}
            <strong className="text-text">{p.last30.sets} séries</strong>, <strong className="text-text">{formatVolume(p.last30.volume)}</strong> levantados
            {p.last30.cardioMin > 0 && (
              <>
                {" "}e <strong className="text-text">{p.last30.cardioMin} min</strong> de cardio
              </>
            )}
            .
          </p>

          <Section title="Por semana">
            <Card className="p-4">
              <Segmented
                label="Métrica semanal"
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "workouts", label: "Treinos" },
                  { value: "volume", label: "Volume" },
                  { value: "cardioMin", label: "Cardio" },
                ]}
              />
              <div className="mt-4">
                <ColumnChart
                  label={`Gráfico semanal de ${metric === "workouts" ? "treinos" : metric === "volume" ? "volume" : "minutos de cardio"} nas últimas 12 semanas`}
                  unit={metric === "volume" ? " kg" : metric === "cardioMin" ? " min" : ""}
                  data={p.weeks.map((w) => ({ x: shortDate(w.start), y: w[metric], detail: `semana de ${shortDate(w.start)}` }))}
                  color={metric === "cardioMin" ? "var(--lilac)" : "var(--rose)"}
                />
              </div>
              <p className="mt-2 text-xs text-text-3">
                Meta: {p.weeklyGoal} treinos por semana{p.weekStreak > 0 ? ` · ${p.weekStreak} ${p.weekStreak === 1 ? "semana" : "semanas"} seguidas na meta` : ""}
              </p>
            </Card>
          </Section>

          <Section title="Recordes recentes">
            {p.recentPrs.length ? (
              <ul className="flex flex-col gap-2">
                {p.recentPrs.map((r, i) => {
                  const ex = byId.get(r.exerciseId);
                  return (
                    <li key={i}>
                      <Link href={`/exercicios/${r.exerciseId}`} className="flex items-center gap-3 rounded-lg bg-surface p-3 hover:bg-surface-2">
                        <ExerciseThumb id={r.exerciseId} name={ex?.name ?? ""} size={48} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{ex?.name ?? "Exercício"}</p>
                          <p className="text-xs text-text-3">
                            {r.kind === "weight" ? "Maior carga" : "Força estimada (1RM)"} · {new Date(r.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display tabular flex items-center gap-1 text-lg font-bold">
                            <Trophy className="size-4 text-peach" aria-hidden />
                            {formatKg(r.value)} kg
                          </p>
                          {r.previous != null && <p className="tabular text-xs text-text-3">antes {formatKg(r.previous)} kg</p>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="Nenhum recorde ainda" icon={<Trophy className="size-6" />}>
                Quando você superar a sua melhor carga num exercício, ela aparece aqui.
              </EmptyState>
            )}
          </Section>

          <Section title="Séries por músculo · 7 dias">
            <Card className="p-4">
              {Object.keys(p.muscleSets7d).length ? (
                <>
                  <BarList
                    items={TRAINABLE_GROUPS.filter((g) => p.muscleSets7d[g])
                      .map((g) => ({ label: GROUP_LABEL[g], value: Math.round((p.muscleSets7d[g] ?? 0) * 10) / 10 }))
                      .sort((a, b) => b.value - a.value)}
                  />
                  <p className="mt-3 text-xs text-text-3">Séries de trabalho. Músculos secundários contam meia série.</p>
                </>
              ) : (
                <p className="text-sm text-text-3">Sem séries nos últimos 7 dias.</p>
              )}
            </Card>
          </Section>

          <Section title="Recuperação muscular">
            <Card className="p-4" id="recuperacao">
              <RecoveryList items={p.recovery} />
              <p className="mt-3 text-xs text-text-3">Estimativa pelo tempo desde o último treino e pelo número de séries. Use como guia, não como regra.</p>
            </Card>
          </Section>

          {p.topExercises.length > 0 && (
            <Section title="Seus exercícios" action={<Link href="/exercicios" className="text-sm font-semibold text-lilac">Biblioteca</Link>}>
              <ul className="flex flex-col gap-2">
                {p.topExercises.map((t) => (
                  <li key={t.exerciseId}>
                    <Link href={`/exercicios/${t.exerciseId}`} className="flex items-center gap-3 rounded-lg bg-surface p-3 hover:bg-surface-2">
                      <ExerciseThumb id={t.exerciseId} name={byId.get(t.exerciseId)?.name ?? ""} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{byId.get(t.exerciseId)?.name ?? "Exercício"}</span>
                        <span className="block text-xs text-text-3">
                          {t.sessions} {t.sessions === 1 ? "treino" : "treinos"} em 90 dias · máx. {formatKg(t.bestWeight)} kg
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-text-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <BodyWeight entries={p.bodyWeight} />

          <Section>
            <Link href="/cardio" className="flex items-center gap-3 rounded-lg bg-surface p-4 hover:bg-surface-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-lilac-soft text-lilac">
                <HeartPulse className="size-5" />
              </span>
              <span className="flex-1 font-semibold">Cardio</span>
              <ChevronRight className="size-5 text-text-3" aria-hidden />
            </Link>
          </Section>
        </>
      )}
    </div>
  );
}

function BodyWeight({ entries }: { entries: { day: string; weightKg: number }[] }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const invalidate = useInvalidate();
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const last = entries[entries.length - 1];
  const first = entries[0];
  return (
    <Section title="Peso corporal">
      <Card className="p-4">
        {entries.length >= 2 ? (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <p className="font-display tabular text-2xl font-bold">{formatKg(last.weightKg)} kg</p>
              <p className="tabular text-sm text-text-3">
                {last.weightKg - first.weightKg >= 0 ? "+" : ""}
                {formatKg(last.weightKg - first.weightKg)} kg desde {shortDate(first.day)}
              </p>
            </div>
            <LineChart label="Evolução do peso corporal" unit=" kg" color="var(--lilac)" data={entries.slice(-30).map((e) => ({ x: shortDate(e.day), y: e.weightKg }))} />
          </>
        ) : last ? (
          <p className="text-sm text-text-2">
            Último registro: <strong className="text-text">{formatKg(last.weightKg)} kg</strong> em {shortDate(last.day)}. Registre de novo em outro dia para ver a evolução.
          </p>
        ) : (
          <p className="text-sm text-text-2">Registre seu peso de vez em quando para acompanhar a evolução.</p>
        )}
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const kg = Number(value.replace(",", "."));
            if (!kg) return;
            setSaving(true);
            try {
              await api("/api/body", { method: "POST", json: { day: iso, weightKg: kg } });
              await invalidate(qk.progress, qk.body);
              setValue("");
              toast("Peso registrado", { tone: "success" });
            } catch (err) {
              toast(errorMessage(err), { tone: "error" });
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Peso de hoje em kg</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              placeholder="Peso de hoje"
              className="tabular h-12 w-full rounded-full bg-surface-2 px-4 pr-10 font-semibold focus:outline-2 focus:outline-rose"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-3">kg</span>
          </label>
          <Button type="submit" loading={saving} disabled={!value}>
            Registrar
          </Button>
        </form>
      </Card>
    </Section>
  );
}
