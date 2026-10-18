"use client";
import Link from "next/link";
import { ChartLine, ExternalLink, Languages } from "lucide-react";
import { Badge } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { gifUrl, useCatalog, useExercise } from "@/lib/client/hooks";
import { GROUP_LABEL } from "@/lib/muscles";
import type { ExerciseDetail } from "@/lib/types";

/** Big demonstration + how-to, used from the library, the plan editor and the live session. */
export function ExerciseDetailSheet({ id, onClose, footer }: { id: string | null; onClose: () => void; footer?: React.ReactNode }) {
  const { byId } = useCatalog();
  const { data, isLoading } = useExercise(id);
  const name = data?.name ?? (id ? byId.get(id)?.name : "") ?? "";
  return (
    <Sheet open={Boolean(id)} onClose={onClose} title={name} footer={footer}>
      {id && <ExerciseHowTo id={id} data={data} loading={isLoading} />}
    </Sheet>
  );
}

export function ExerciseHowTo({ id, data, loading, hideHistoryLink }: { id: string; data?: ExerciseDetail; loading?: boolean; hideHistoryLink?: boolean }) {
  const custom = id.startsWith("c_");
  return (
    <div>
      {!custom && (
        <div className="isolate mx-auto flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-lg bg-thumb" style={{ background: "var(--thumb)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gifUrl(id)} alt={`Demonstração animada: ${data?.name ?? "exercício"}`} className="size-full object-contain mix-blend-multiply" width={288} height={288} />
        </div>
      )}
      {loading || !data ? (
        <div className="mt-5 flex flex-col gap-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge tone="rose">{GROUP_LABEL[data.group]}</Badge>
            {data.target && data.target !== GROUP_LABEL[data.group] && <Badge tone="lilac">{data.target}</Badge>}
            {data.equipment && <Badge>{data.equipment}</Badge>}
          </div>
          {data.secondaryMuscles.length > 0 && (
            <p className="mt-3 text-sm text-text-2">
              <span className="font-semibold text-text">Também trabalha:</span> {data.secondaryMuscles.join(", ")}
            </p>
          )}
          {data.videoUrl && (
            <a href={data.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-lilac">
              <ExternalLink className="size-4" /> Ver vídeo de execução
            </a>
          )}
          {data.notes && <p className="mt-3 text-sm text-text-2">{data.notes}</p>}
          {data.instructions.length > 0 && (
            <>
              <h3 className="mt-6 text-lg font-bold">Como fazer</h3>
              {data.instructionsLang === "en" && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-3">
                  <Languages className="size-3.5" /> Instruções originais em inglês
                </p>
              )}
              <ol className="mt-3 flex flex-col gap-3">
                {data.instructions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-text-2">
                    <span className="font-display tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-text">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          {!hideHistoryLink && (
            <Link href={`/exercicios/${id}`} className="mt-6 flex items-center justify-center gap-2 rounded-full bg-surface-2 py-3 font-semibold hover:bg-surface-3">
              <ChartLine className="size-4" /> Meu histórico neste exercício
            </Link>
          )}
          {!custom && <p className="mt-4 text-center text-[11px] text-text-3">Demonstração: ExerciseDB · © Gym visual</p>}
        </>
      )}
    </div>
  );
}
