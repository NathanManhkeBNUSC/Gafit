"use client";
import { Check, Info, Plus, Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { Input, Select } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCatalog, useInvalidate } from "@/lib/client/hooks";
import { EQUIPMENT_FILTERS, GROUP_LABEL, TRAINABLE_GROUPS } from "@/lib/muscles";
import { isStaple, searchExercises } from "@/lib/search";
import type { CatalogExercise, MuscleGroup } from "@/lib/types";
import { ExerciseDetailSheet } from "./exercise-detail";
import { ExerciseThumb } from "./exercise-thumb";

/**
 * Library search used everywhere an exercise is chosen: adding to a plan, adding during a
 * session, and swapping. In swap mode it opens filtered to the same muscle group.
 */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  multi,
  swapFrom,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (ids: string[]) => void;
  multi?: boolean;
  swapFrom?: string | null;
  title?: string;
}) {
  const { list, byId, searchable, isLoading } = useCatalog();
  const from = swapFrom ? byId.get(swapFrom) : undefined;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");
  const [equip, setEquip] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const deferred = useDeferredValue(query);
  const activeGroup = group || (from && !query ? from.group : "");

  const results = useMemo(() => {
    let pool = searchable;
    if (activeGroup) pool = pool.filter((e) => e.group === activeGroup);
    if (equip) pool = pool.filter((e) => e.equipmentKey === equip);
    if (deferred.trim()) return searchExercises(pool, deferred, 80);
    // No query: when swapping, closest matches first (same target, then same equipment); then staples.
    const sim = (e: CatalogExercise) => (from ? Number(e.target === from.target) * 2 + Number(e.equipmentKey === from.equipmentKey) : 0);
    return [...pool]
      .filter((e) => e.group !== "cardio")
      .sort((a, b) => sim(b) - sim(a) || Number(isStaple(b.name)) - Number(isStaple(a.name)) || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, 80);
  }, [searchable, activeGroup, equip, deferred, from]);

  function close() {
    setQuery("");
    setGroup("");
    setEquip("");
    setSelected([]);
    onClose();
  }

  function choose(id: string) {
    if (!multi) {
      onPick([id]);
      close();
      return;
    }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={close}
        tall
        title={title ?? (swapFrom ? "Trocar exercício" : "Adicionar exercício")}
        footer={
          multi && selected.length > 0 ? (
            <Button
              block
              size="lg"
              onClick={() => {
                onPick(selected);
                close();
              }}
            >
              Adicionar {selected.length} {selected.length === 1 ? "exercício" : "exercícios"}
            </Button>
          ) : undefined
        }
      >
        {from && (
          <p className="mb-3 rounded-sm bg-lilac-soft px-3 py-2 text-sm text-lilac">
            Mostrando opções para <strong>{GROUP_LABEL[from.group]}</strong>, mesmo músculo de “{from.name}”.
          </p>
        )}
        <div className="sticky top-0 z-10 -mx-5 bg-bg-elev px-5 pb-3">
          <label className="relative block">
            <span className="sr-only">Buscar exercício</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-3" aria-hidden />
            <input
              autoFocus={!swapFrom}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar: supino, puxada, leg 45…"
              className="h-12 w-full rounded-full border border-line bg-surface-2 pl-12 pr-11 text-base focus:border-rose focus:outline-none"
              enterKeyHint="search"
            />
            {query && (
              <button type="button" aria-label="Limpar busca" onClick={() => setQuery("")} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:text-text">
                <X className="size-4" />
              </button>
            )}
          </label>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            <Chip active={!activeGroup} onClick={() => setGroup("")}>
              Todos
            </Chip>
            {TRAINABLE_GROUPS.map((g) => (
              <Chip key={g} active={activeGroup === g} onClick={() => setGroup(activeGroup === g ? "" : g)}>
                {GROUP_LABEL[g]}
              </Chip>
            ))}
          </div>
          <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
            {EQUIPMENT_FILTERS.map((f) => (
              <Chip key={f.key} active={equip === f.key} onClick={() => setEquip(equip === f.key ? "" : f.key)} className="h-8 text-xs">
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-text-3">Carregando biblioteca…</p>
        ) : (
          <ul className="flex flex-col">
            {results.map((e) => (
              <PickRow
                key={e.id}
                e={e}
                selected={selected.includes(e.id)}
                disabled={e.id === swapFrom}
                onChoose={() => choose(e.id)}
                onInfo={() => setDetail(e.id)}
              />
            ))}
            {results.length === 0 && (
              <li className="py-8 text-center text-sm text-text-3">
                Nada encontrado{query ? ` para “${query}”` : ""}. Tente outro nome ou crie o seu.
              </li>
            )}
          </ul>
        )}
        <Button variant="outline" block className="mt-4" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          Criar exercício próprio
        </Button>
        <p className="mt-3 text-center text-xs text-text-3">{list.length} exercícios · demonstrações: ExerciseDB</p>
      </Sheet>
      <ExerciseDetailSheet id={detail} onClose={() => setDetail(null)} />
      <CreateExerciseSheet
        open={creating}
        initialName={query}
        initialGroup={activeGroup || ""}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false);
          choose(id);
        }}
      />
    </>
  );
}

function PickRow({ e, selected, disabled, onChoose, onInfo }: { e: CatalogExercise; selected: boolean; disabled: boolean; onChoose: () => void; onInfo: () => void }) {
  return (
    <li className="flex items-center gap-1 border-b border-line last:border-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onChoose}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left disabled:opacity-40"
      >
        <span className="relative">
          <ExerciseThumb id={e.id} name={e.name} size={52} />
          {selected && (
            <span className="anim-pop absolute inset-0 flex items-center justify-center rounded-sm bg-rose/85 text-rose-ink">
              <Check className="size-6" strokeWidth={3} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("line-clamp-2 block font-semibold leading-snug", selected && "text-rose")}>{e.name}</span>
          <span className="block truncate text-xs text-text-3">
            {GROUP_LABEL[e.group]}
            {e.equipment ? ` · ${e.equipment}` : ""}
            {e.custom ? " · seu" : ""}
          </span>
        </span>
      </button>
      <button type="button" onClick={onInfo} aria-label={`Ver execução de ${e.name}`} className="flex size-11 items-center justify-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text">
        <Info className="size-5" />
      </button>
    </li>
  );
}

function CreateExerciseSheet({
  open,
  onClose,
  onCreated,
  initialName,
  initialGroup,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  initialName: string;
  initialGroup: string;
}) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const [saving, setSaving] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title="Novo exercício">
      <form
        key={String(open)}
        className="flex flex-col gap-4"
        onSubmit={async (ev) => {
          ev.preventDefault();
          const f = new FormData(ev.currentTarget);
          setSaving(true);
          try {
            const res = await api<{ exercise: { id: string } }>("/api/custom-exercises", {
              method: "POST",
              json: { name: f.get("name"), group: f.get("group"), equipment: f.get("equipment") || null, videoUrl: f.get("videoUrl") || null },
            });
            await invalidate(qk.custom);
            toast("Exercício criado", { tone: "success" });
            onCreated(res.exercise.id);
          } catch (e) {
            toast(errorMessage(e), { tone: "error" });
          } finally {
            setSaving(false);
          }
        }}
      >
        <p className="text-sm text-text-2">Para aquele aparelho da sua academia que não está na biblioteca.</p>
        <Input name="name" label="Nome" defaultValue={initialName} required placeholder="Ex.: Remada articulada Hammer" />
        <Select name="group" label="Músculo principal" defaultValue={initialGroup || "peito"}>
          {TRAINABLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABEL[g]}
            </option>
          ))}
        </Select>
        <Input name="equipment" label="Equipamento (opcional)" placeholder="Máquina, polia, halteres…" />
        <Input name="videoUrl" type="url" label="Link de vídeo (opcional)" placeholder="https://youtube.com/…" hint="Aparece como “Ver execução” no treino." />
        <Button type="submit" size="lg" block loading={saving}>
          Criar e adicionar
        </Button>
      </form>
    </Sheet>
  );
}
