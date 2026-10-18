"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChartLine,
  CloudOff,
  HeartPulse,
  Info,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Repeat2,
  Timer,
  Trash2,
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCatalog, useInvalidate, useLastPerformance, useMe, type LastPerformance } from "@/lib/client/hooks";
import { shortId } from "@/lib/ids";
import { GROUP_LABEL, SET_TYPE_LABEL, SET_TYPE_SHORT, cardioLabel } from "@/lib/muscles";
import { formatClock, formatKg, repsUpper } from "@/lib/training";
import type { CardioDTO, SetType, WorkoutData, WorkoutDTO, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { CardioForm } from "../cardio-form";
import { ExerciseDetailSheet } from "../exercise-detail";
import { ExercisePicker } from "../exercise-picker";
import { ExerciseThumb } from "../exercise-thumb";
import { REST_OPTIONS, restLabel } from "../plan-editor";
import { RestBar, useRestTimer } from "./rest-timer";

const backupKey = (id: string) => `gafit-workout-${id}`;

type SaveState = "saved" | "saving" | "offline";

export function SessionView({ workout, cardio: initialCardio }: { workout: WorkoutDTO; cardio: CardioDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidate();
  const { byId } = useCatalog();
  const { data: me } = useMe();
  const defaultRest = me?.user.restDefaultSec ?? 90;

  const [data, setDataState] = useState<WorkoutData>(() => {
    try {
      const raw = localStorage.getItem(backupKey(workout.id));
      if (raw) return (JSON.parse(raw) as { data: WorkoutData }).data;
    } catch {}
    return workout.data;
  });
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [cardio, setCardio] = useState(initialCardio);
  const [save, setSave] = useState<SaveState>("saved");
  const [now, setNow] = useState(() => Date.now());
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "swap"; exId: string; from: string } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [menuEx, setMenuEx] = useState<string | null>(null);
  const [setMenu, setSetMenu] = useState<{ exId: string; setId: string } | null>(null);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [notesOpen, setNotesOpen] = useState(Boolean(workout.notes));
  const [busy, setBusy] = useState(false);
  const timer = useRestTimer({ sound: true });

  const exerciseIds = useMemo(() => data.exercises.map((e) => e.exerciseId), [data.exercises]);
  const { data: last } = useLastPerformance(exerciseIds, workout.id);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keep the screen on while training.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {}
    };
    acquire();
    const onVis = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  // Autosave: local backup immediately, server after a short pause.
  const first = useRef(true);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ data, notes });
  useEffect(() => {
    latest.current = { data, notes };
  }, [data, notes]);
  const flush = useCallback(async () => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
    setSave("saving");
    try {
      await api(`/api/workouts/${workout.id}`, { method: "PUT", json: { data: latest.current.data, notes: latest.current.notes || null } });
      setSave("saved");
    } catch {
      setSave("offline");
    }
  }, [workout.id]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(backupKey(workout.id), JSON.stringify({ data, savedAt: Date.now() }));
    } catch {}
    setSave("saving");
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(flush, 800);
  }, [data, notes, workout.id, flush]);
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && pending.current && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const setData = (fn: (d: WorkoutData) => WorkoutData) => setDataState((d) => fn(d));
  const updateEx = (exId: string, fn: (e: WorkoutExercise) => WorkoutExercise) =>
    setData((d) => ({ exercises: d.exercises.map((e) => (e.id === exId ? fn(e) : e)) }));
  const updateSet = (exId: string, setId: string, patch: Partial<WorkoutSet>) =>
    updateEx(exId, (e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }));

  const totalSets = data.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = data.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const elapsed = (now - new Date(workout.startedAt).getTime()) / 1000;

  function toggleDone(ex: WorkoutExercise, set: WorkoutSet, idx: number) {
    if (set.done) {
      updateSet(ex.id, set.id, { done: false, doneAt: null });
      return;
    }
    const prev = prevFor(last, ex.exerciseId, idx);
    const weight = set.weight ?? prev?.weight ?? carryWeight(ex, idx);
    const reps = set.reps ?? prev?.reps ?? repsUpper(ex.targetReps) ?? null;
    if (!reps) {
      toast("Digite quantas repetições você fez");
      document.getElementById(`reps-${set.id}`)?.focus();
      return;
    }
    updateSet(ex.id, set.id, { done: true, weight, reps, doneAt: new Date().toISOString() });
    // Rest after the set, except mid-superset (next exercise shares the group letter).
    const i = data.exercises.findIndex((e) => e.id === ex.id);
    const next = data.exercises[i + 1];
    const midSuperset = ex.group && next?.group === ex.group;
    const isLastSetOfWorkout = i === data.exercises.length - 1 && idx === ex.sets.length - 1;
    if (!midSuperset && !isLastSetOfWorkout && set.type !== "warmup") timer.start(ex.restSec, byId.get(ex.exerciseId)?.name ?? "");
    else if (set.type === "warmup") timer.start(Math.min(60, ex.restSec), "aquecimento");
  }

  async function finish() {
    setBusy(true);
    if (pending.current) clearTimeout(pending.current);
    try {
      await api(`/api/workouts/${workout.id}`, { method: "PUT", json: { notes: notes || null } });
      await api(`/api/workouts/${workout.id}/finish`, { method: "POST", json: { data } });
      localStorage.removeItem(backupKey(workout.id));
      timer.stop();
      await invalidate(qk.active, qk.next, qk.progress, qk.workouts, ["last"], ["exercise-history"]);
      router.replace(`/historico/${workout.id}?resumo=1`);
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    try {
      await api(`/api/workouts/${workout.id}`, { method: "DELETE" });
      localStorage.removeItem(backupKey(workout.id));
      timer.stop();
      await invalidate(qk.active, qk.next);
      router.replace("/");
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
      setBusy(false);
    }
  }

  const menuExercise = data.exercises.find((e) => e.id === menuEx);
  const menuSet = setMenu ? data.exercises.find((e) => e.id === setMenu.exId)?.sets.find((s) => s.id === setMenu.setId) : undefined;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl pb-40">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/92 px-2 pb-2 pt-[max(8px,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-1">
          <Link href="/" aria-label="Voltar para o início (o treino continua)" className="flex size-11 items-center justify-center rounded-full text-text-2 hover:bg-surface-2">
            <ChevronLeft className="size-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{workout.name}</p>
            <p className="flex items-center gap-2 text-xs text-text-3">
              <span className="tabular font-semibold text-text-2">{formatClock(elapsed)}</span>
              <span aria-hidden>·</span>
              <span className="tabular">
                {doneSets}/{totalSets} séries
              </span>
              {save === "offline" && (
                <span className="flex items-center gap-1 text-peach">
                  <CloudOff className="size-3.5" /> salvo no aparelho
                </span>
              )}
            </p>
          </div>
          <IconButton label="Opções do treino" onClick={() => setHeaderMenu(true)}>
            <MoreHorizontal className="size-5" />
          </IconButton>
          <Button size="sm" onClick={() => setFinishOpen(true)} className="ml-1 h-10 px-4">
            Finalizar
          </Button>
        </div>
        <div className="mx-2 mt-2 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full rounded-full bg-rose transition-[width] duration-300" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </div>
      </header>

      <div className="flex flex-col gap-4 px-3 pt-4">
        {data.exercises.length === 0 && (
          <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
            <p className="text-lg font-bold">Treino livre</p>
            <p className="mt-1 text-sm text-text-2">Adicione os exercícios conforme for fazendo.</p>
          </div>
        )}
        {data.exercises.map((ex, i) => (
          <ExerciseBlock
            key={ex.id}
            ex={ex}
            index={i}
            name={byId.get(ex.exerciseId)?.name ?? "Exercício"}
            originalName={ex.originalExerciseId ? byId.get(ex.originalExerciseId)?.name : undefined}
            last={last}
            onDetail={() => setDetail(ex.exerciseId)}
            onMenu={() => setMenuEx(ex.id)}
            onSetChange={(setId, patch) => updateSet(ex.id, setId, patch)}
            onToggle={(set, idx) => toggleDone(ex, set, idx)}
            onSetMenu={(setId) => setSetMenu({ exId: ex.id, setId })}
            onAddSet={() =>
              updateEx(ex.id, (e) => {
                const prevSet = e.sets[e.sets.length - 1];
                return { ...e, sets: [...e.sets, { id: shortId(), weight: prevSet?.weight ?? null, reps: null, type: "normal", done: false }] };
              })
            }
          />
        ))}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="soft" size="lg" icon={<Plus className="size-5" />} onClick={() => setPicker({ mode: "add" })}>
            Exercício
          </Button>
          <Button variant="secondary" size="lg" icon={<HeartPulse className="size-5" />} onClick={() => setCardioOpen(true)}>
            Cardio
          </Button>
        </div>

        {cardio.length > 0 && (
          <div className="rounded-lg bg-surface p-4">
            <p className="mb-2 text-sm font-bold">Cardio neste treino</p>
            {cardio.map((c) => (
              <p key={c.id} className="flex justify-between text-sm text-text-2">
                <span>{cardioLabel(c.kind)}</span>
                <span className="tabular">
                  {c.durationMin} min{c.distanceKm ? ` · ${formatKg(c.distanceKm, 2)} km` : ""}
                </span>
              </p>
            ))}
          </div>
        )}

        {notesOpen ? (
          <label className="block">
            <span className="mb-1.5 block px-1 text-sm font-semibold text-text-2">Anotações do treino</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Como foi? Dor, energia, ajuste de carga para a próxima…"
              className="w-full rounded-md border border-line bg-surface-2 p-4 text-base focus:border-rose focus:outline-none"
              maxLength={2000}
            />
          </label>
        ) : (
          <button type="button" onClick={() => setNotesOpen(true)} className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-text-2 hover:text-text">
            <NotebookPen className="size-4" /> Anotação do treino
          </button>
        )}
      </div>

      {timer.rest && <RestBar rest={timer.rest} remaining={timer.remaining} onAdjust={timer.adjust} onSkip={timer.stop} />}

      {/* Sheets */}
      <ExercisePicker
        open={Boolean(picker)}
        multi={picker?.mode === "add"}
        swapFrom={picker?.mode === "swap" ? picker.from : null}
        onClose={() => setPicker(null)}
        onPick={(ids) => {
          if (picker?.mode === "swap") {
            const target = picker.exId;
            updateEx(target, (e) => ({
              ...e,
              exerciseId: ids[0],
              originalExerciseId: e.originalExerciseId ?? e.exerciseId,
              sets: e.sets.map((s) => (s.done ? s : { ...s, weight: null, reps: null })),
            }));
            toast(`Trocado por ${byId.get(ids[0])?.name ?? "outro exercício"}`);
          } else {
            setData((d) => ({
              exercises: [
                ...d.exercises,
                ...ids.map((id) => ({
                  id: shortId(),
                  exerciseId: id,
                  restSec: defaultRest,
                  targetReps: null,
                  sets: Array.from({ length: 3 }, () => ({ id: shortId(), weight: null, reps: null, type: "normal" as SetType, done: false })),
                })),
              ],
            }));
          }
        }}
      />
      <ExerciseDetailSheet id={detail} onClose={() => setDetail(null)} />

      <Sheet open={Boolean(menuExercise)} onClose={() => setMenuEx(null)} title={menuExercise ? byId.get(menuExercise.exerciseId)?.name : ""}>
        {menuExercise && (
          <ExerciseMenu
            ex={menuExercise}
            isFirst={data.exercises[0]?.id === menuExercise.id}
            isLast={data.exercises[data.exercises.length - 1]?.id === menuExercise.id}
            onClose={() => setMenuEx(null)}
            onDetail={() => {
              setMenuEx(null);
              setDetail(menuExercise.exerciseId);
            }}
            onSwap={() => {
              setMenuEx(null);
              setPicker({ mode: "swap", exId: menuExercise.id, from: menuExercise.exerciseId });
            }}
            onChange={(patch) => updateEx(menuExercise.id, (e) => ({ ...e, ...patch }))}
            onMove={(dir) => {
              setData((d) => {
                const xs = [...d.exercises];
                const i = xs.findIndex((e) => e.id === menuExercise.id);
                const j = i + dir;
                if (j < 0 || j >= xs.length) return d;
                [xs[i], xs[j]] = [xs[j], xs[i]];
                return { exercises: xs };
              });
              setMenuEx(null);
            }}
            onRemove={() => {
              const removed = menuExercise;
              const idx = data.exercises.findIndex((e) => e.id === removed.id);
              setData((d) => ({ exercises: d.exercises.filter((e) => e.id !== removed.id) }));
              setMenuEx(null);
              toast("Exercício removido", {
                action: {
                  label: "Desfazer",
                  onClick: () => setData((d) => ({ exercises: [...d.exercises.slice(0, idx), removed, ...d.exercises.slice(idx)] })),
                },
              });
            }}
          />
        )}
      </Sheet>

      <Sheet open={Boolean(menuSet)} onClose={() => setSetMenu(null)} title="Tipo de série">
        {menuSet && setMenu && (
          <div className="flex flex-col gap-2">
            {(Object.keys(SET_TYPE_LABEL) as SetType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  updateSet(setMenu.exId, setMenu.setId, { type: t });
                  setSetMenu(null);
                }}
                className={cn(
                  "flex h-14 items-center gap-3 rounded-md px-4 text-left font-semibold transition-colors",
                  menuSet.type === t ? "bg-rose-soft text-rose" : "bg-surface hover:bg-surface-2",
                )}
              >
                <SetTypeMark type={t} n={0} />
                <span className="flex-1">{SET_TYPE_LABEL[t]}</span>
                {menuSet.type === t && <Check className="size-5" />}
              </button>
            ))}
            <Button
              variant="danger"
              block
              className="mt-4"
              icon={<Trash2 className="size-4" />}
              onClick={() => {
                updateEx(setMenu.exId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setMenu.setId) }));
                setSetMenu(null);
              }}
            >
              Remover série
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={cardioOpen} onClose={() => setCardioOpen(false)} title="Registrar cardio">
        <CardioForm
          workoutId={workout.id}
          onSaved={(c) => {
            setCardio((xs) => [...xs, c]);
            setCardioOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={headerMenu} onClose={() => setHeaderMenu(false)} title="Treino">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" block icon={<NotebookPen className="size-4" />} onClick={() => { setNotesOpen(true); setHeaderMenu(false); }}>
            Anotação do treino
          </Button>
          <Button variant="secondary" block icon={<HeartPulse className="size-4" />} onClick={() => { setHeaderMenu(false); setCardioOpen(true); }}>
            Registrar cardio
          </Button>
          <div className="mt-6 border-t border-line pt-4">
            <Button variant="danger" block icon={<Trash2 className="size-4" />} onClick={() => { setHeaderMenu(false); setDiscardOpen(true); }}>
              Descartar treino
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title="Finalizar treino?">
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface p-4 text-center">
          <div>
            <p className="font-display tabular text-2xl font-bold">{formatClock(elapsed)}</p>
            <p className="text-xs text-text-3">duração</p>
          </div>
          <div>
            <p className="font-display tabular text-2xl font-bold">{doneSets}</p>
            <p className="text-xs text-text-3">séries feitas</p>
          </div>
          <div>
            <p className="font-display tabular text-2xl font-bold">
              {Math.round(data.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done && s.type !== "warmup").reduce((b, s) => b + (s.weight ?? 0) * (s.reps ?? 0), 0), 0)).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-text-3">kg de volume</p>
          </div>
        </div>
        {totalSets - doneSets > 0 && (
          <p className="mt-4 rounded-sm bg-peach-soft px-4 py-3 text-sm text-peach">
            {totalSets - doneSets} {totalSets - doneSets === 1 ? "série não marcada fica" : "séries não marcadas ficam"} de fora do histórico.
          </p>
        )}
        <Button size="lg" block className="mt-5" loading={busy} disabled={doneSets === 0 && cardio.length === 0} onClick={finish}>
          Finalizar e salvar
        </Button>
        <Button variant="ghost" block className="mt-2" onClick={() => setFinishOpen(false)}>
          Continuar treinando
        </Button>
      </Sheet>

      <ConfirmSheet
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Descartar este treino?"
        message="Tudo o que você registrou nesta sessão será apagado. Isso não dá para desfazer."
        confirmLabel="Descartar treino"
        danger
        loading={busy}
        onConfirm={discard}
      />
    </div>
  );
}

function prevFor(last: LastPerformance | undefined, exerciseId: string, idx: number) {
  const sets = last?.[exerciseId]?.sets.filter((s) => s.type !== "warmup");
  if (!sets?.length) return null;
  return sets[Math.min(idx, sets.length - 1)];
}

/** Weight typed in an earlier set of this exercise, used when there is no history yet. */
function carryWeight(ex: WorkoutExercise, idx: number) {
  for (let i = idx - 1; i >= 0; i--) if (ex.sets[i].weight != null) return ex.sets[i].weight;
  return null;
}

function SetTypeMark({ type, n }: { type: SetType; n: number }) {
  const short = SET_TYPE_SHORT[type];
  return (
    <span
      className={cn(
        "font-display tabular flex size-8 items-center justify-center rounded-full text-sm font-bold",
        type === "normal" && "bg-surface-2 text-text-2",
        type === "warmup" && "bg-peach-soft text-peach",
        type === "drop" && "bg-lilac-soft text-lilac",
        type === "failure" && "bg-danger-soft text-danger",
      )}
    >
      {short || (n > 0 ? n : "#")}
    </span>
  );
}

function ExerciseBlock({
  ex,
  index,
  name,
  originalName,
  last,
  onDetail,
  onMenu,
  onSetChange,
  onToggle,
  onSetMenu,
  onAddSet,
}: {
  ex: WorkoutExercise;
  index: number;
  name: string;
  originalName?: string;
  last?: LastPerformance;
  onDetail: () => void;
  onMenu: () => void;
  onSetChange: (setId: string, patch: Partial<WorkoutSet>) => void;
  onToggle: (set: WorkoutSet, idx: number) => void;
  onSetMenu: (setId: string) => void;
  onAddSet: () => void;
}) {
  const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.done);
  const lastSets = last?.[ex.exerciseId];
  let normalCount = 0;
  return (
    <section className={cn("rounded-lg bg-surface transition-opacity", allDone && "opacity-80")} aria-label={name}>
      <div className="flex items-start gap-3 p-3 pb-2">
        <button type="button" onClick={onDetail} className="relative rounded-sm" aria-label={`Ver execução de ${name}`}>
          <ExerciseThumb id={ex.exerciseId} name={name} size={64} />
          <span className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white">
            <Info className="size-3" />
          </span>
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            {ex.group && <Badge tone="lilac">Bi-set {ex.group}</Badge>}
            {allDone && <Badge tone="mint">Feito</Badge>}
          </div>
          <h3 className="mt-0.5 font-sans text-[17px] font-bold leading-snug tracking-normal">
            <span className="text-text-3">{index + 1}. </span>
            {name}
          </h3>
          {originalName && <p className="text-xs text-text-3">no lugar de {originalName}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-text-3">
            {ex.targetReps && <span>Meta {ex.targetReps} reps</span>}
            <span className="flex items-center gap-1">
              <Timer className="size-3" /> {restLabel(ex.restSec)}
            </span>
          </p>
        </div>
        <IconButton label={`Opções de ${name}`} onClick={onMenu} className="-mr-1">
          <MoreHorizontal className="size-5" />
        </IconButton>
      </div>
      {ex.notes && <p className="mx-3 mb-2 rounded-sm bg-surface-2 px-3 py-2 text-xs text-text-2">{ex.notes}</p>}

      <div className="px-2 pb-2" role="table" aria-label={`Séries de ${name}`}>
        <div role="row" className="grid grid-cols-[2.5rem_1fr_4.75rem_4.25rem_3.25rem] items-center gap-1.5 px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-3">
          <span role="columnheader" className="text-center">Série</span>
          <span role="columnheader">Anterior</span>
          <span role="columnheader" className="text-center">kg</span>
          <span role="columnheader" className="text-center">Reps</span>
          <span role="columnheader" className="sr-only">Feito</span>
        </div>
        {ex.sets.map((s, i) => {
          if (s.type !== "warmup") normalCount++;
          const prev = prevFor(last, ex.exerciseId, i);
          const placeholderReps = prev?.reps ?? repsUpper(ex.targetReps);
          const placeholderKg = prev ? prev.weight : carryWeight(ex, i);
          return (
            <div
              role="row"
              key={s.id}
              className={cn(
                "grid grid-cols-[2.5rem_1fr_4.75rem_4.25rem_3.25rem] items-center gap-1.5 rounded-md px-1 py-1 transition-colors duration-200",
                s.done && "bg-rose-soft",
              )}
            >
              <button type="button" role="cell" onClick={() => onSetMenu(s.id)} aria-label={`Série ${i + 1}: ${SET_TYPE_LABEL[s.type]}. Mudar tipo`} className="flex justify-center">
                <SetTypeMark type={s.type} n={normalCount} />
              </button>
              <span role="cell" className="tabular truncate text-sm text-text-3">
                {prev ? `${formatKg(prev.weight)} × ${prev.reps}` : "–"}
              </span>
              <input
                role="cell"
                aria-label={`Carga da série ${i + 1} em kg`}
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                value={s.weight ?? ""}
                placeholder={placeholderKg != null ? formatKg(placeholderKg) : "–"}
                onChange={(e) => onSetChange(s.id, { weight: e.target.value === "" ? null : Number(e.target.value) })}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "tabular h-12 w-full rounded-sm bg-surface-2 text-center text-lg font-bold placeholder:font-semibold placeholder:text-text-3 focus:outline-2 focus:outline-rose",
                  s.done && "bg-transparent",
                )}
              />
              <input
                role="cell"
                id={`reps-${s.id}`}
                aria-label={`Repetições da série ${i + 1}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={s.reps ?? ""}
                placeholder={placeholderReps ? String(placeholderReps) : "–"}
                onChange={(e) => onSetChange(s.id, { reps: e.target.value === "" ? null : Math.round(Number(e.target.value)) })}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "tabular h-12 w-full rounded-sm bg-surface-2 text-center text-lg font-bold placeholder:font-semibold placeholder:text-text-3 focus:outline-2 focus:outline-rose",
                  s.done && "bg-transparent",
                )}
              />
              <button
                type="button"
                onClick={() => onToggle(s, i)}
                aria-pressed={s.done}
                aria-label={s.done ? `Desmarcar série ${i + 1}` : `Marcar série ${i + 1} como feita`}
                className={cn(
                  "flex size-12 items-center justify-center rounded-sm transition-colors duration-150",
                  s.done ? "anim-pop bg-rose text-rose-ink" : "bg-surface-2 text-text-3 hover:text-text",
                )}
              >
                <Check className="size-6" strokeWidth={s.done ? 3 : 2.25} />
              </button>
            </div>
          );
        })}
        <button type="button" onClick={onAddSet} className="mt-1 flex h-11 w-full items-center justify-center gap-1.5 rounded-md text-sm font-semibold text-text-2 hover:bg-surface-2 hover:text-text">
          <Plus className="size-4" /> Série
        </button>
        {lastSets && (
          <p className="px-2 pb-1 text-[11px] text-text-3">
            Última vez em {new Date(lastSets.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>
    </section>
  );
}

function ExerciseMenu({
  ex,
  isFirst,
  isLast,
  onClose,
  onDetail,
  onSwap,
  onChange,
  onMove,
  onRemove,
}: {
  ex: WorkoutExercise;
  isFirst: boolean;
  isLast: boolean;
  onClose: () => void;
  onDetail: () => void;
  onSwap: () => void;
  onChange: (p: Partial<WorkoutExercise>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { byId } = useCatalog();
  const group = byId.get(ex.exerciseId)?.group;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Info className="size-4" />} onClick={onDetail}>
          Execução
        </Button>
        <Button variant="secondary" icon={<Repeat2 className="size-4" />} onClick={onSwap}>
          Trocar
        </Button>
      </div>
      {group && <p className="px-1 text-xs text-text-3">Trocar sugere exercícios de {GROUP_LABEL[group]}.</p>}
      <Button variant="secondary" block icon={<ChartLine className="size-4" />} href={`/exercicios/${ex.exerciseId}`}>
        Meu histórico neste exercício
      </Button>
      <label className="mt-2 block">
        <span className="mb-1 block px-1 text-sm font-semibold text-text-2">Descanso entre séries</span>
        <span className="relative block">
          <select
            value={ex.restSec}
            onChange={(e) => onChange({ restSec: Number(e.target.value) })}
            className="h-12 w-full appearance-none rounded-full bg-surface-2 px-4 font-semibold focus:outline-2 focus:outline-rose"
          >
            {[...new Set([...REST_OPTIONS, ex.restSec])].sort((a, b) => a - b).map((s) => (
              <option key={s} value={s}>
                {restLabel(s)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-3" />
        </span>
      </label>
      <label className="block">
        <span className="mb-1 block px-1 text-sm font-semibold text-text-2">Observação</span>
        <input
          value={ex.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Ex.: banco no 3, pegada fechada"
          className="h-12 w-full rounded-full bg-surface-2 px-4 focus:outline-2 focus:outline-rose"
          maxLength={500}
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<ArrowUp className="size-4" />} disabled={isFirst} onClick={() => onMove(-1)}>
          Subir
        </Button>
        <Button variant="secondary" icon={<ArrowDown className="size-4" />} disabled={isLast} onClick={() => onMove(1)}>
          Descer
        </Button>
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <Button variant="danger" block icon={<Trash2 className="size-4" />} onClick={onRemove}>
          Remover do treino
        </Button>
      </div>
      <Button variant="ghost" block onClick={onClose}>
        Pronto
      </Button>
    </div>
  );
}
