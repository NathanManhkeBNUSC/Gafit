"use client";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { ExerciseThumb } from "@/components/app/exercise-thumb";
import { Button, IconButton } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Skeleton, Stat } from "@/components/ui/misc";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCatalog, useInvalidate, useWorkout } from "@/lib/client/hooks";
import { useQueryFlag } from "@/lib/client/use-client";
import { GROUP_LABEL, SET_TYPE_SHORT, cardioLabel } from "@/lib/muscles";
import { formatDuration, formatKg, formatVolume } from "@/lib/training";
import type { MuscleGroup, WorkoutData } from "@/lib/types";

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useWorkout(id);
  const { byId } = useCatalog();
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidate();
  const fresh = useQueryFlag("resumo");
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<WorkoutData | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading || !data) return <Skeleton className="mt-16 h-96 rounded-lg" />;
  const w = data.workout;
  const s = w.summary;
  const date = new Date(w.startedAt);
  const shown = editing ?? w.data;

  async function saveEdits() {
    if (!editing) return;
    setBusy(true);
    try {
      await api(`/api/workouts/${id}`, { method: "PUT", json: { data: editing } });
      await invalidate(qk.workout(id), qk.progress, qk.workouts, ["exercise-history"], ["last"]);
      setEditing(null);
      toast("Treino atualizado", { tone: "success" });
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={fresh ? "Treino concluído!" : w.name}
        subtitle={`${fresh ? `${w.name} · ` : ""}${date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
        back={fresh ? () => router.replace("/") : "/historico"}
        actions={
          !editing && (
            <IconButton label="Opções" onClick={() => setMenu(true)}>
              <MoreHorizontal className="size-5" />
            </IconButton>
          )
        }
      />

      {s && (
        <Card className={cn("grid grid-cols-2 gap-x-4 gap-y-5 p-5 sm:grid-cols-4", fresh && "anim-rise")}>
          <Stat value={formatDuration(w.durationSec)} label="duração" />
          <Stat value={formatVolume(s.volume)} label="volume" />
          <Stat value={s.sets} label="séries" />
          <Stat value={s.reps} label="repetições" />
        </Card>
      )}

      {s && s.prs.length > 0 && (
        <Card className={cn("mt-3 bg-peach-soft p-4", fresh && "anim-rise")}>
          <p className="flex items-center gap-2 font-bold text-peach">
            <Trophy className="size-5" /> {s.prs.length === 1 ? "Novo recorde!" : `${s.prs.length} recordes novos!`}
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {s.prs.map((p, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{byId.get(p.exerciseId)?.name ?? "Exercício"}</span>
                <span className="tabular shrink-0 font-semibold">
                  {formatKg(p.value)} kg{p.kind === "e1rm" ? " (1RM est.)" : ""}
                  {p.previous != null && <span className="font-normal text-text-3"> · antes {formatKg(p.previous)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {s && Object.keys(s.groups).length > 0 && (
        <p className="mt-4 px-1 text-sm text-text-2">
          <span className="font-semibold text-text">Músculos: </span>
          {(Object.entries(s.groups) as [MuscleGroup, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([g]) => GROUP_LABEL[g])
            .join(", ")}
        </p>
      )}

      <Section title="Exercícios">
        <div className="flex flex-col gap-3">
          {shown.exercises.map((ex, ei) => {
            const name = byId.get(ex.exerciseId)?.name ?? "Exercício";
            const sets = editing ? ex.sets : ex.sets.filter((x) => x.done);
            if (!sets.length) return null;
            return (
              <Card key={ex.id} className="p-3">
                <div className="flex items-center gap-3">
                  <ExerciseThumb id={ex.exerciseId} name={name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name}</p>
                    {ex.originalExerciseId && <p className="text-xs text-text-3">no lugar de {byId.get(ex.originalExerciseId)?.name}</p>}
                  </div>
                </div>
                <ol className="mt-2 flex flex-col">
                  {sets.map((st, si) => (
                    <li key={st.id} className="flex items-center gap-3 border-t border-line py-2 text-sm first:border-0">
                      <span className="tabular w-6 text-center font-bold text-text-3">{SET_TYPE_SHORT[st.type] || si + 1}</span>
                      {editing ? (
                        <>
                          <EditNum
                            label="kg"
                            value={st.weight}
                            onChange={(v) => setEditing(patchSet(editing, ei, st.id, { weight: v }))}
                          />
                          <span className="text-text-3">×</span>
                          <EditNum label="reps" value={st.reps} onChange={(v) => setEditing(patchSet(editing, ei, st.id, { reps: v == null ? null : Math.round(v), done: v != null && v > 0 }))} />
                        </>
                      ) : (
                        <span className="tabular flex-1 font-semibold">
                          {formatKg(st.weight ?? 0)} kg × {st.reps}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
                {ex.notes && <p className="mt-1 text-xs text-text-3">{ex.notes}</p>}
              </Card>
            );
          })}
        </div>
      </Section>

      {data.cardio.length > 0 && (
        <Section title="Cardio">
          <Card className="p-4">
            {data.cardio.map((c) => (
              <p key={c.id} className="flex justify-between py-1 text-sm">
                <span className="font-semibold">{cardioLabel(c.kind)}</span>
                <span className="tabular text-text-2">
                  {c.durationMin} min{c.distanceKm ? ` · ${formatKg(c.distanceKm, 2)} km` : ""}
                  {c.calories ? ` · ${c.calories} kcal` : ""}
                </span>
              </p>
            ))}
          </Card>
        </Section>
      )}

      {w.notes && (
        <Section title="Anotações">
          <Card className="whitespace-pre-wrap p-4 text-sm text-text-2">{w.notes}</Card>
        </Section>
      )}

      {editing ? (
        <div className="mt-6 flex gap-2">
          <Button variant="ghost" block onClick={() => setEditing(null)}>
            Cancelar
          </Button>
          <Button block loading={busy} onClick={saveEdits}>
            Salvar alterações
          </Button>
        </div>
      ) : (
        fresh && (
          <Button href="/" size="lg" block className="mt-8">
            Concluir
          </Button>
        )
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title="Treino">
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            block
            icon={<Pencil className="size-4" />}
            onClick={() => {
              setEditing(structuredClone(w.data));
              setMenu(false);
            }}
          >
            Corrigir cargas e repetições
          </Button>
          <Button variant="danger" block className="mt-4" icon={<Trash2 className="size-4" />} onClick={() => { setMenu(false); setConfirm(true); }}>
            Excluir treino
          </Button>
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Excluir este treino?"
        message="Ele sai do histórico, dos gráficos e dos recordes. Isso não dá para desfazer."
        confirmLabel="Excluir treino"
        danger
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api(`/api/workouts/${id}`, { method: "DELETE" });
            await invalidate(qk.workouts, qk.progress, qk.next, ["last"], ["exercise-history"]);
            router.replace("/historico");
          } catch (e) {
            toast(errorMessage(e), { tone: "error" });
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function patchSet(d: WorkoutData, ei: number, setId: string, patch: Partial<WorkoutData["exercises"][number]["sets"][number]>): WorkoutData {
  return {
    exercises: d.exercises.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e)),
  };
}

function EditNum({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="tabular h-10 w-20 rounded-sm bg-surface-2 text-center font-semibold focus:outline-2 focus:outline-rose"
      />
    </label>
  );
}
