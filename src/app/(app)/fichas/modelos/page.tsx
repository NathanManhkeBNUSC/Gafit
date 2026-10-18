"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { DayBadge, Skeleton, dayLetter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCatalog, useInvalidate } from "@/lib/client/hooks";
import type { PlanDTO } from "@/lib/types";

interface TemplateDTO {
  key: string;
  name: string;
  level: string;
  daysPerWeek: number;
  description: string;
  days: { name: string; focus: string; exerciseIds: string[] }[];
}

export default function TemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: qk.templates,
    queryFn: async () => (await api<{ templates: TemplateDTO[] }>("/api/templates")).templates,
    staleTime: Infinity,
  });
  const { byId } = useCatalog();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidate();

  return (
    <div>
      <PageHeader title="Modelos prontos" back="/fichas" subtitle="Um ponto de partida. Depois de copiar, ajuste à vontade." />
      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : (
        <div className="flex flex-col gap-3">
          {data?.map((t) => (
            <article key={t.key} className="rounded-lg bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{t.name}</h2>
                <Badge tone={t.level === "Iniciante" ? "mint" : t.level === "Avançado" ? "peach" : "lilac"}>{t.level}</Badge>
              </div>
              <p className="mt-1 text-sm text-text-2">{t.description}</p>
              <p className="mt-1 text-xs font-semibold text-text-3">{t.daysPerWeek}x por semana</p>
              <ul className="mt-3 flex flex-col gap-2">
                {t.days.map((d, i) => (
                  <li key={d.name} className="flex gap-3">
                    <DayBadge index={i} label={dayLetter(d.name, i)} size="sm" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{d.focus}</p>
                      <p className="line-clamp-2 text-text-3">{d.exerciseIds.map((id) => byId.get(id)?.name ?? "…").join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Button
                block
                className="mt-4"
                loading={busy === t.key}
                onClick={async () => {
                  setBusy(t.key);
                  try {
                    const res = await api<{ plan: PlanDTO }>(`/api/templates/${t.key}`, { method: "POST" });
                    await invalidate(qk.plans, qk.next);
                    toast("Modelo copiado e ativado", { tone: "success" });
                    router.push(`/fichas/${res.plan.id}`);
                  } catch (e) {
                    toast(errorMessage(e), { tone: "error" });
                    setBusy(null);
                  }
                }}
              >
                Usar este modelo
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
