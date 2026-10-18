"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { DayBadge, dayLetter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useCatalog, useInvalidate } from "@/lib/client/hooks";
import type { PlanDTO, PlanDay } from "@/lib/types";

export default function SharedCodePage() {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<{ name: string; ownerName: string; days: PlanDay[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { byId } = useCatalog();
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidate();

  async function lookup() {
    setError(null);
    setLoading(true);
    try {
      setPreview(await api(`/api/shared/${encodeURIComponent(code.trim().toUpperCase())}`));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function copy(activate: boolean) {
    setLoading(true);
    try {
      const res = await api<{ plan: PlanDTO }>("/api/plans/import-code", { method: "POST", json: { code: code.trim().toUpperCase(), activate } });
      await invalidate(qk.plans, qk.next);
      toast("Ficha copiada", { tone: "success" });
      router.push(`/fichas/${res.plan.id}`);
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Código de um amigo" back="/fichas" subtitle="Você recebe uma cópia sua; o que mudar nela não afeta a do amigo." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup();
        }}
        className="flex gap-2"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Código</span>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
              setPreview(null);
            }}
            placeholder="EX.: K7M2QX"
            autoCapitalize="characters"
            autoComplete="off"
            className="font-display tabular h-14 w-full rounded-full bg-surface-2 px-5 text-center text-2xl font-bold tracking-[0.2em] placeholder:text-base placeholder:tracking-normal focus:outline-2 focus:outline-rose"
          />
        </label>
        <Button type="submit" size="lg" loading={loading && !preview} disabled={code.length < 4}>
          Buscar
        </Button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-sm bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      {preview && (
        <div className="anim-rise mt-6 rounded-lg bg-surface p-4">
          <p className="text-sm text-text-3">Ficha de {preview.ownerName}</p>
          <h2 className="text-2xl font-bold">{preview.name}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {preview.days.map((d, i) => (
              <li key={d.id} className="flex gap-3">
                <DayBadge index={i} label={dayLetter(d.name, i)} size="sm" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{d.name}{d.focus ? ` · ${d.focus}` : ""}</p>
                  <p className="line-clamp-2 text-text-3">{d.exercises.map((e) => byId.get(e.exerciseId)?.name ?? "exercício próprio").join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2">
            <Button block size="lg" loading={loading} onClick={() => copy(true)}>
              Copiar e usar como ativa
            </Button>
            <Button block variant="ghost" disabled={loading} onClick={() => copy(false)}>
              Só copiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
