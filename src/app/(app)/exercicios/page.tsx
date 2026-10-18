"use client";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { ExerciseThumb } from "@/components/app/exercise-thumb";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/misc";
import { useCatalog } from "@/lib/client/hooks";
import { EQUIPMENT_FILTERS, GROUP_LABEL, TRAINABLE_GROUPS } from "@/lib/muscles";
import { isStaple, searchExercises } from "@/lib/search";
import type { MuscleGroup } from "@/lib/types";

export default function LibraryPage() {
  const { searchable, isLoading } = useCatalog();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");
  const [equip, setEquip] = useState("");
  const [limit, setLimit] = useState(60);
  const dq = useDeferredValue(q);

  const results = useMemo(() => {
    let pool = searchable;
    if (group) pool = pool.filter((e) => e.group === group);
    if (equip) pool = pool.filter((e) => e.equipmentKey === equip);
    if (dq.trim()) return searchExercises(pool, dq, 400);
    return [...pool].sort((a, b) => Number(isStaple(b.name)) - Number(isStaple(a.name)) || a.name.localeCompare(b.name, "pt-BR"));
  }, [searchable, group, equip, dq]);

  return (
    <div>
      <PageHeader title="Exercícios" back="/fichas" subtitle="Toque para ver a execução e o seu histórico." />
      <label className="relative block">
        <span className="sr-only">Buscar exercício</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-3" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(60);
          }}
          placeholder="Buscar: supino, puxada, leg 45…"
          className="h-12 w-full rounded-full border border-line bg-surface-2 pl-12 pr-4 text-base focus:border-rose focus:outline-none"
          enterKeyHint="search"
        />
      </label>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        <Chip active={!group} onClick={() => setGroup("")}>
          Todos
        </Chip>
        {TRAINABLE_GROUPS.map((g) => (
          <Chip key={g} active={group === g} onClick={() => setGroup(group === g ? "" : g)}>
            {GROUP_LABEL[g]}
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
        {EQUIPMENT_FILTERS.map((f) => (
          <Chip key={f.key} active={equip === f.key} onClick={() => setEquip(equip === f.key ? "" : f.key)} className="h-8 text-xs">
            {f.label}
          </Chip>
        ))}
      </div>
      <p className="mt-4 px-1 text-xs text-text-3">{results.length} exercícios</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-96 rounded-lg" />
      ) : (
        <ul className="mt-2 flex flex-col">
          {results.slice(0, limit).map((e) => (
            <li key={e.id}>
              <Link href={`/exercicios/${e.id}`} className="flex items-center gap-3 border-b border-line py-2.5">
                <ExerciseThumb id={e.id} name={e.name} size={52} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block font-semibold leading-snug">{e.name}</span>
                  <span className="block truncate text-xs text-text-3">
                    {GROUP_LABEL[e.group]}
                    {e.equipment ? ` · ${e.equipment}` : ""}
                    {e.custom ? " · seu" : ""}
                  </span>
                </span>
                <ChevronRight className="size-5 text-text-3" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {results.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + 80)} className="mt-4 h-12 w-full rounded-full bg-surface font-semibold text-text-2 hover:text-text">
          Mostrar mais
        </button>
      )}
    </div>
  );
}
