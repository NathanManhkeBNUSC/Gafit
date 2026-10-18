"use client";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, Copy, MoreHorizontal, Plus, Repeat2, Search, Timer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { DayBadge, dayLetter } from "@/components/ui/misc";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { shortId } from "@/lib/ids";
import { useCatalog } from "@/lib/client/hooks";
import { GROUP_LABEL } from "@/lib/muscles";
import { estimateDayMinutes } from "@/lib/training";
import type { PlanDay, PlanExercise } from "@/lib/types";
import { ExerciseDetailSheet } from "./exercise-detail";
import { ExercisePicker } from "./exercise-picker";
import { ExerciseThumb } from "./exercise-thumb";

export interface EditorExercise extends Omit<PlanExercise, "exerciseId"> {
  exerciseId: string; // "" while an imported line is still unresolved
  rawName?: string;
  candidates?: string[];
}
export interface EditorDay extends Omit<PlanDay, "exercises"> {
  exercises: EditorExercise[];
}
export interface EditorState {
  name: string;
  notes: string;
  days: EditorDay[];
}

export const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
export const restLabel = (s: number) => (s === 0 ? "Sem descanso" : s < 60 ? `${s}s` : s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}min${s % 60}`);

export function newDay(index: number): EditorDay {
  return { id: shortId(), name: `Treino ${String.fromCharCode(65 + index)}`, focus: "", exercises: [] };
}

export function newExercise(exerciseId: string, restSec = 90): EditorExercise {
  return { id: shortId(), exerciseId, sets: 3, reps: "10-12", restSec, weight: null, notes: null };
}

/** Strips editor-only fields; returns null while something still needs the user's attention. */
export function toPlanDays(days: EditorDay[]): PlanDay[] {
  return days.map((d) => ({
    id: d.id,
    name: d.name.trim() || "Treino",
    focus: d.focus?.trim() || null,
    exercises: d.exercises
      .filter((e) => e.exerciseId)
      .map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps.trim(),
        restSec: e.restSec,
        weight: e.weight ?? null,
        notes: e.notes?.trim() || null,
        group: e.group ?? null,
      })),
  }));
}

export function PlanEditor({ value, onChange }: { value: EditorState; onChange: (v: EditorState) => void }) {
  const [dayIdx, setDayIdx] = useState(0);
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "swap"; exId: string; from: string | null } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [dayMenu, setDayMenu] = useState(false);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const { byId } = useCatalog();
  const day = value.days[Math.min(dayIdx, value.days.length - 1)];

  const setDay = (patch: Partial<EditorDay>) =>
    onChange({ ...value, days: value.days.map((d) => (d.id === day.id ? { ...d, ...patch } : d)) });
  const setExercise = (id: string, patch: Partial<EditorExercise>) =>
    setDay({ exercises: day.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const move = (id: string, dir: -1 | 1) => {
    const i = day.exercises.findIndex((e) => e.id === id);
    const j = i + dir;
    if (j < 0 || j >= day.exercises.length) return;
    const xs = [...day.exercises];
    [xs[i], xs[j]] = [xs[j], xs[i]];
    setDay({ exercises: xs });
  };
  const unresolved = useMemo(() => value.days.reduce((a, d) => a + d.exercises.filter((e) => !e.exerciseId).length, 0), [value.days]);

  if (!day) return null;
  return (
    <div>
      <label className="block">
        <span className="sr-only">Nome da ficha</span>
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Nome da ficha"
          className="font-display w-full bg-transparent text-3xl font-extrabold tracking-tight placeholder:text-text-3 focus:outline-none"
          maxLength={80}
        />
      </label>
      <textarea
        value={value.notes}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        placeholder="Observações gerais (opcional): aquecimento, cadência, dias da semana…"
        rows={value.notes ? 2 : 1}
        className="mt-1 w-full resize-none bg-transparent text-sm text-text-2 placeholder:text-text-3 focus:outline-none"
        maxLength={2000}
      />

      {unresolved > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-sm bg-peach-soft px-3 py-2.5 text-sm text-peach">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {unresolved === 1 ? "1 exercício precisa" : `${unresolved} exercícios precisam`} que você escolha o equivalente na biblioteca.
        </p>
      )}

      {/* Day tabs */}
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Dias da ficha">
        {value.days.map((d, i) => {
          const active = d.id === day.id;
          const pending = d.exercises.some((e) => !e.exerciseId);
          return (
            <button
              key={d.id}
              role="tab"
              aria-selected={active}
              onClick={() => setDayIdx(i)}
              className={cn(
                "flex h-12 shrink-0 items-center gap-2 rounded-full pl-1.5 pr-4 text-sm font-semibold transition-colors",
                active ? "bg-surface-3 text-text" : "bg-surface text-text-2 hover:bg-surface-2",
              )}
            >
              <DayBadge index={i} label={dayLetter(d.name, i)} size="sm" className="size-9" />
              <span className="max-w-32 truncate">{d.name}</span>
              {pending && <span className="size-2 rounded-full bg-peach" aria-label="pendente" />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            onChange({ ...value, days: [...value.days, newDay(value.days.length)] });
            setDayIdx(value.days.length);
          }}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-4 text-sm font-semibold text-text-2 hover:text-text"
        >
          <Plus className="size-4" /> Dia
        </button>
      </div>

      {/* Day header */}
      <div className="mt-4 rounded-lg bg-surface p-4">
        <div className="flex items-center gap-2">
          <input
            value={day.name}
            onChange={(e) => setDay({ name: e.target.value })}
            aria-label="Nome do dia"
            className="min-w-0 flex-1 bg-transparent text-xl font-bold focus:outline-none"
            maxLength={60}
          />
          <IconButton label="Opções do dia" onClick={() => setDayMenu(true)}>
            <MoreHorizontal className="size-5" />
          </IconButton>
        </div>
        <input
          value={day.focus ?? ""}
          onChange={(e) => setDay({ focus: e.target.value })}
          placeholder="Foco do dia, ex.: Peito e tríceps"
          aria-label="Foco do dia"
          className="mt-1 w-full bg-transparent text-sm text-text-2 placeholder:text-text-3 focus:outline-none"
          maxLength={80}
        />
        {day.exercises.length > 0 && (
          <p className="mt-3 flex items-center gap-3 text-xs font-semibold text-text-3">
            <span>{day.exercises.length} exercícios</span>
            <span>{day.exercises.reduce((a, e) => a + e.sets, 0)} séries</span>
            <span className="flex items-center gap-1">
              <Timer className="size-3.5" /> ~{estimateDayMinutes(day.exercises)} min
            </span>
          </p>
        )}
      </div>

      <ol className="mt-3 flex flex-col gap-3">
        {day.exercises.map((ex, i) => (
          <li key={ex.id}>
            <ExerciseEditorCard
              ex={ex}
              index={i}
              total={day.exercises.length}
              name={byId.get(ex.exerciseId)?.name}
              group={byId.get(ex.exerciseId)?.group}
              resolveName={(id) => byId.get(id)?.name ?? id}
              onChange={(p) => setExercise(ex.id, p)}
              onMove={(d) => move(ex.id, d)}
              onRemove={() => setDay({ exercises: day.exercises.filter((e) => e.id !== ex.id) })}
              onSwap={() => setPicker({ mode: "swap", exId: ex.id, from: ex.exerciseId || null })}
              onDetail={() => ex.exerciseId && setDetail(ex.exerciseId)}
            />
          </li>
        ))}
      </ol>

      <Button variant="soft" block size="lg" className="mt-3" icon={<Plus className="size-5" />} onClick={() => setPicker({ mode: "add" })}>
        Adicionar exercícios
      </Button>

      <ExercisePicker
        open={Boolean(picker)}
        multi={picker?.mode === "add"}
        swapFrom={picker?.mode === "swap" ? picker.from : null}
        title={picker?.mode === "swap" && !picker.from ? "Escolher exercício" : undefined}
        onClose={() => setPicker(null)}
        onPick={(ids) => {
          if (picker?.mode === "swap") setExercise(picker.exId, { exerciseId: ids[0], candidates: undefined });
          else setDay({ exercises: [...day.exercises, ...ids.map((id) => newExercise(id, 90))] });
        }}
      />
      <ExerciseDetailSheet id={detail} onClose={() => setDetail(null)} />

      <Sheet open={dayMenu} onClose={() => setDayMenu(false)} title={day.name}>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            block
            icon={<Copy className="size-4" />}
            onClick={() => {
              const copy: EditorDay = { ...day, id: shortId(), name: `${day.name} (cópia)`, exercises: day.exercises.map((e) => ({ ...e, id: shortId() })) };
              onChange({ ...value, days: [...value.days, copy] });
              setDayIdx(value.days.length);
              setDayMenu(false);
            }}
          >
            Duplicar dia
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" block icon={<ArrowUp className="size-4" />} disabled={dayIdx === 0} onClick={() => reorderDay(-1)}>
              Mover antes
            </Button>
            <Button variant="secondary" block icon={<ArrowDown className="size-4" />} disabled={dayIdx >= value.days.length - 1} onClick={() => reorderDay(1)}>
              Mover depois
            </Button>
          </div>
          <Button
            variant="danger"
            block
            className="mt-4"
            icon={<Trash2 className="size-4" />}
            disabled={value.days.length <= 1}
            onClick={() => {
              setDayMenu(false);
              setConfirmDeleteDay(true);
            }}
          >
            Excluir dia
          </Button>
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmDeleteDay}
        onClose={() => setConfirmDeleteDay(false)}
        title={`Excluir ${day.name}?`}
        message="O dia e os exercícios dele saem da ficha. Os treinos que você já registrou continuam no histórico."
        confirmLabel="Excluir dia"
        danger
        onConfirm={() => {
          onChange({ ...value, days: value.days.filter((d) => d.id !== day.id) });
          setDayIdx(Math.max(0, dayIdx - 1));
          setConfirmDeleteDay(false);
        }}
      />
    </div>
  );

  function reorderDay(dir: -1 | 1) {
    const j = dayIdx + dir;
    const xs = [...value.days];
    [xs[dayIdx], xs[j]] = [xs[j], xs[dayIdx]];
    onChange({ ...value, days: xs });
    setDayIdx(j);
    setDayMenu(false);
  }
}

function ExerciseEditorCard({
  ex,
  index,
  total,
  name,
  group,
  resolveName,
  onChange,
  onMove,
  onRemove,
  onSwap,
  onDetail,
}: {
  ex: EditorExercise;
  index: number;
  total: number;
  name?: string;
  group?: keyof typeof GROUP_LABEL;
  resolveName: (id: string) => string;
  onChange: (p: Partial<EditorExercise>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  onSwap: () => void;
  onDetail: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(ex.notes));
  const unresolved = !ex.exerciseId;

  return (
    <div className={cn("rounded-lg bg-surface p-3", unresolved && "ring-1 ring-peach/50")}>
      <div className="flex items-center gap-3">
        <span className="font-display tabular w-5 text-center text-sm font-bold text-text-3">{index + 1}</span>
        {unresolved ? (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-peach-soft text-peach">
            <AlertTriangle className="size-5" />
          </div>
        ) : (
          <button type="button" onClick={onDetail} aria-label={`Ver execução de ${name}`} className="rounded-sm">
            <ExerciseThumb id={ex.exerciseId} name={name ?? ""} size={56} />
          </button>
        )}
        <button type="button" onClick={onSwap} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-semibold">{unresolved ? ex.rawName : name ?? "…"}</span>
          <span className="block truncate text-xs text-text-3">
            {unresolved ? "Não encontrado · toque para escolher" : group ? GROUP_LABEL[group] : ""}
            {ex.rawName && !unresolved && name && ex.rawName.toLowerCase() !== name.toLowerCase() ? ` · na ficha: “${ex.rawName}”` : ""}
          </span>
        </button>
        <IconButton label="Mais opções" onClick={() => setMenu(true)}>
          <MoreHorizontal className="size-5" />
        </IconButton>
      </div>

      {ex.candidates && ex.candidates.length > 1 && (
        <div className="no-scrollbar -mx-3 mt-3 flex gap-2 overflow-x-auto px-3">
          {ex.candidates.slice(0, 5).map((c) => (
            <Chip key={c} active={c === ex.exerciseId} onClick={() => onChange({ exerciseId: c })} className="h-8 text-xs">
              {resolveName(c)}
            </Chip>
          ))}
          <Chip onClick={onSwap} className="h-8 text-xs">
            <Search className="size-3.5" /> Outro
          </Chip>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1 block px-1 text-[11px] font-semibold text-text-3">Séries</span>
          <Stepper value={ex.sets} onChange={(v) => onChange({ sets: v })} min={1} max={20} label="séries" />
        </div>
        <label className="block">
          <span className="mb-1 block px-1 text-[11px] font-semibold text-text-3">Repetições</span>
          <input
            value={ex.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            placeholder="10-12"
            className="tabular h-12 w-full rounded-full bg-surface-2 px-4 text-center font-semibold focus:outline-2 focus:outline-rose"
            maxLength={40}
          />
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-[11px] font-semibold text-text-3">Descanso</span>
          <span className="relative block">
            <select
              value={ex.restSec}
              onChange={(e) => onChange({ restSec: Number(e.target.value) })}
              className="h-12 w-full appearance-none rounded-full bg-surface-2 px-4 text-center font-semibold focus:outline-2 focus:outline-rose"
            >
              {[...new Set([...REST_OPTIONS, ex.restSec])].sort((a, b) => a - b).map((s) => (
                <option key={s} value={s}>
                  {restLabel(s)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-[11px] font-semibold text-text-3">Carga inicial</span>
          <span className="relative block">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              value={ex.weight ?? ""}
              onChange={(e) => onChange({ weight: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="opcional"
              className="tabular h-12 w-full rounded-full bg-surface-2 px-4 pr-10 text-center font-semibold placeholder:font-normal focus:outline-2 focus:outline-rose"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-3">kg</span>
          </span>
        </label>
      </div>
      {showNotes ? (
        <input
          value={ex.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Observação: pegada, cadência, bi-set com…"
          className="mt-2 h-11 w-full rounded-full bg-surface-2 px-4 text-sm focus:outline-2 focus:outline-rose"
          maxLength={500}
          autoFocus={!ex.notes}
        />
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} className="mt-2 flex items-center gap-1 px-1 text-xs font-semibold text-lilac">
          <Plus className="size-3.5" /> Observação
        </button>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={unresolved ? ex.rawName : name}>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" block icon={<Repeat2 className="size-4" />} onClick={() => { setMenu(false); onSwap(); }}>
            Trocar exercício
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" block icon={<ArrowUp className="size-4" />} disabled={index === 0} onClick={() => { onMove(-1); setMenu(false); }}>
              Subir
            </Button>
            <Button variant="secondary" block icon={<ArrowDown className="size-4" />} disabled={index >= total - 1} onClick={() => { onMove(1); setMenu(false); }}>
              Descer
            </Button>
          </div>
          <Button variant="danger" block className="mt-4" icon={<Trash2 className="size-4" />} onClick={() => { setMenu(false); onRemove(); }}>
            Remover da ficha
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
