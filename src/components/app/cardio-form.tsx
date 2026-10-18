"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip, Segmented } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { CARDIO_KINDS } from "@/lib/muscles";
import type { CardioDTO } from "@/lib/types";

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(",", ".").trim();
  return s === "" ? null : Number(s);
};

/** One form for cardio, used standalone and inside a session. */
export function CardioForm({ workoutId, onSaved }: { workoutId?: string | null; onSaved: (c: CardioDTO) => void }) {
  const [kind, setKind] = useState("esteira");
  const [intensity, setIntensity] = useState<"leve" | "moderado" | "intenso">("moderado");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const meta = CARDIO_KINDS.find((k) => k.key === kind)!;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const f = new FormData(e.currentTarget);
        const durationMin = num(f.get("durationMin"));
        if (!durationMin) {
          setError("Informe quanto tempo durou.");
          return;
        }
        setSaving(true);
        try {
          const res = await api<{ cardio: CardioDTO }>("/api/cardio", {
            method: "POST",
            json: {
              workoutId: workoutId ?? null,
              kind,
              intensity,
              durationMin,
              distanceKm: meta.hasDistance ? num(f.get("distanceKm")) : null,
              incline: meta.hasIncline ? num(f.get("incline")) : null,
              calories: num(f.get("calories")) != null ? Math.round(num(f.get("calories"))!) : null,
              avgHr: num(f.get("avgHr")) != null ? Math.round(num(f.get("avgHr"))!) : null,
              notes: String(f.get("notes") ?? "").trim() || null,
            },
          });
          toast("Cardio registrado", { tone: "success" });
          onSaved(res.cardio);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <div>
        <span className="mb-2 block px-1 text-sm font-semibold text-text-2">Tipo</span>
        <div className="flex flex-wrap gap-2">
          {CARDIO_KINDS.map((k) => (
            <Chip key={k.key} active={kind === k.key} onClick={() => setKind(k.key)}>
              {k.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input name="durationMin" label="Duração" suffix="min" inputMode="decimal" placeholder="20" required />
        {meta.hasDistance ? <Input name="distanceKm" label="Distância" suffix="km" inputMode="decimal" placeholder="opcional" /> : <div />}
        {meta.hasIncline && <Input name="incline" label="Inclinação" suffix="%" inputMode="decimal" placeholder="opcional" />}
        <Input name="calories" label="Calorias" suffix="kcal" inputMode="numeric" placeholder="opcional" />
        <Input name="avgHr" label="FC média" suffix="bpm" inputMode="numeric" placeholder="opcional" />
      </div>
      <div>
        <span className="mb-2 block px-1 text-sm font-semibold text-text-2">Intensidade</span>
        <Segmented
          label="Intensidade"
          value={intensity}
          onChange={setIntensity}
          options={[
            { value: "leve", label: "Leve" },
            { value: "moderado", label: "Moderada" },
            { value: "intenso", label: "Intensa" },
          ]}
        />
      </div>
      <Textarea name="notes" label="Observação" rows={2} placeholder="Ex.: intervalado 1 min forte / 1 min leve" className="[&_textarea]:min-h-0" />
      {error && (
        <p role="alert" className="rounded-sm bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block loading={saving}>
        Salvar cardio
      </Button>
    </form>
  );
}
