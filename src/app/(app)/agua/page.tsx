"use client";
import Link from "next/link";
import { useState } from "react";
import { Droplet, Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { ColumnChart } from "@/components/app/charts";
import { QuickAdd, useAddWater } from "@/components/app/water";
import { Button, IconButton } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { localDay, qk, useInvalidate, useMe, useWater } from "@/lib/client/hooks";
import { formatLiters } from "@/lib/water";

export default function WaterPage() {
  const day = localDay();
  const { data, isLoading } = useWater(day);
  const { data: me } = useMe();
  const [custom, setCustom] = useState(false);
  const [settings, setSettings] = useState(false);
  const invalidate = useInvalidate();
  const toast = useToast();

  if (isLoading || !data || !me) return <Skeleton className="mt-16 h-96 rounded-lg" />;
  const g = data.goal;
  const pct = Math.min(1, data.totalMl / g.goalMl);
  const left = Math.max(0, g.goalMl - data.totalMl);

  return (
    <div>
      <PageHeader title="Água" back="/" subtitle={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} />

      {/* Bottle + numbers */}
      <Card className="flex items-center gap-6 p-5">
        <Bottle pct={pct} />
        <div className="min-w-0 flex-1">
          <p className="font-display tabular text-4xl font-extrabold leading-none">{formatLiters(data.totalMl)}</p>
          <p className="tabular mt-1 text-text-2">de {formatLiters(g.goalMl)}</p>
          <p className="mt-3 text-sm font-semibold" style={{ color: left ? "var(--text-2)" : "var(--mint)" }}>
            {left ? `Faltam ${formatLiters(left)}` : "Meta batida hoje"}
          </p>
          {left > 0 && <p className="text-xs text-text-3">≈ {Math.ceil(left / me.user.cupMl)} copos de {me.user.cupMl} ml</p>}
        </div>
      </Card>

      <QuickAdd day={day} cupMl={me.user.cupMl} sizes={[...new Set([me.user.cupMl, 300, 500])].sort((a, b) => a - b)} className="mt-3" />
      <button type="button" onClick={() => setCustom(true)} className="mt-2 h-11 w-full rounded-full text-sm font-semibold text-text-2 hover:bg-surface-2 hover:text-text">
        Outra quantidade
      </button>

      {g.missing.length > 0 && !g.manual && (
        <Card className="mt-4 bg-water-soft p-4 text-sm">
          <p className="font-semibold text-water">Deixe a meta com a sua cara</p>
          <p className="mt-1 text-text-2">
            Falta {g.missing.join(", ").replace(/, ([^,]*)$/, " e $1")} para calcular a meta pelo seu corpo.
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSettings(true)}>
            Completar dados
          </Button>
        </Card>
      )}

      <Section title="Como sua meta é calculada" action={<button type="button" onClick={() => setSettings(true)} className="text-sm font-semibold text-lilac">Ajustar</button>}>
        <Card className="p-4">
          {g.manual && (
            <p className="mb-3 rounded-sm bg-surface-2 px-3 py-2 text-sm text-text-2">
              Você definiu uma meta manual de <strong className="text-text">{formatLiters(g.goalMl)}</strong>. O cálculo abaixo é só referência.
            </p>
          )}
          <ul className="flex flex-col">
            {g.lines.map((l) => (
              <li key={l.label} className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
                <span className="min-w-0">
                  <span className="block font-semibold">{l.label}</span>
                  <span className="block text-xs text-text-3">{l.detail}</span>
                </span>
                <span className="tabular shrink-0 font-semibold">+{formatLiters(l.ml)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-text-3">
            Faixa de idade: até 30 anos 40 ml/kg, 31–55 35 ml/kg, 56–65 30 ml/kg, acima 25 ml/kg. Com IMC acima de 30, a altura ajusta o peso usado. Treino soma ~600 ml por hora. É uma estimativa: com sede, beba; com orientação médica de restrição de líquidos, siga o seu médico.
          </p>
        </Card>
      </Section>

      <Section title="Últimos 7 dias">
        <Card className="p-4">
          <ColumnChart
            label="Água bebida por dia nos últimos 7 dias"
            unit=" ml"
            color="var(--water)"
            data={data.week.map((w) => ({
              x: new Date(`${w.day}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
              y: w.totalMl,
              detail: w.totalMl >= w.goalMl ? `meta de ${formatLiters(w.goalMl)} batida` : `meta ${formatLiters(w.goalMl)}`,
            }))}
          />
          <p className="mt-2 text-xs text-text-3">
            Meta batida em {data.week.filter((w) => w.totalMl >= w.goalMl).length} de 7 dias
          </p>
        </Card>
      </Section>

      {data.entries.length > 0 && (
        <Section title="Hoje">
          <ul className="flex flex-col gap-2">
            {data.entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-2">
                <Droplet className="size-4 text-water" aria-hidden />
                <span className="tabular flex-1 font-semibold">{e.amountMl} ml</span>
                <span className="tabular text-sm text-text-3">{new Date(e.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <IconButton
                  label={`Apagar ${e.amountMl} ml`}
                  disabled={e.id.startsWith("tmp-")}
                  onClick={async () => {
                    try {
                      await api(`/api/water/${e.id}`, { method: "DELETE" });
                      await invalidate(qk.water(day));
                    } catch (err) {
                      toast(errorMessage(err), { tone: "error" });
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CustomAmountSheet open={custom} onClose={() => setCustom(false)} day={day} cupMl={me.user.cupMl} />
      <WaterSettingsSheet open={settings} onClose={() => setSettings(false)} weightKg={g.weightKg} />
    </div>
  );
}

/** A rounded bottle that fills from the bottom; quarter ticks give scale at a glance. */
function Bottle({ pct }: { pct: number }) {
  return (
    <div className="relative h-44 w-24 shrink-0 overflow-hidden rounded-[26px] bg-surface-2" aria-hidden>
      <div
        className="absolute inset-x-0 bottom-0 bg-water transition-[height] duration-700 ease-[var(--ease-out)]"
        style={{ height: `${Math.max(pct * 100, pct > 0 ? 6 : 0)}%` }}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-water-soft" />
      </div>
      {[25, 50, 75].map((t) => (
        <span key={t} className="absolute right-0 h-px w-3 bg-line-strong" style={{ bottom: `${t}%` }} />
      ))}
    </div>
  );
}

function CustomAmountSheet({ open, onClose, day, cupMl }: { open: boolean; onClose: () => void; day: string; cupMl: number }) {
  const [ml, setMl] = useState(cupMl);
  const { add, busy } = useAddWater(day);
  return (
    <Sheet open={open} onClose={onClose} title="Quanto você bebeu?">
      <div className="flex items-center justify-center gap-4 py-4">
        <IconButton label="Menos 50 ml" variant="secondary" onClick={() => setMl((v) => Math.max(50, v - 50))}>
          <Minus className="size-5" />
        </IconButton>
        <p className="font-display tabular w-40 text-center text-4xl font-extrabold">{ml} ml</p>
        <IconButton label="Mais 50 ml" variant="secondary" onClick={() => setMl((v) => Math.min(3000, v + 50))}>
          <Plus className="size-5" />
        </IconButton>
      </div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {[150, 250, 350, 600, 750, 1000].map((v) => (
          <button key={v} type="button" onClick={() => setMl(v)} className="h-9 rounded-full bg-surface-2 px-3.5 text-sm font-semibold text-text-2 hover:text-text">
            {v} ml
          </button>
        ))}
      </div>
      <Button
        block
        size="lg"
        loading={busy}
        onClick={async () => {
          await add(ml);
          onClose();
        }}
      >
        Adicionar {ml} ml
      </Button>
    </Sheet>
  );
}

function WaterSettingsSheet({ open, onClose, weightKg }: { open: boolean; onClose: () => void; weightKg: number | null }) {
  const { data: me } = useMe();
  const invalidate = useInvalidate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  if (!me) return null;
  const u = me.user;

  async function patch(body: Record<string, unknown>) {
    try {
      await api("/api/me", { method: "PATCH", json: body });
      await invalidate(qk.me, ["water"]);
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Dados da meta">
      <form
        key={String(open)}
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const num = (k: string) => {
            const v = String(f.get(k) ?? "").replace(",", ".").trim();
            return v === "" ? null : Number(v);
          };
          setSaving(true);
          try {
            const w = num("weight");
            if (w && w !== weightKg) await api("/api/body", { method: "POST", json: { day: localDay(), weightKg: w } });
            await api("/api/me", {
              method: "PATCH",
              json: { heightCm: num("height") != null ? Math.round(num("height")!) : null, birthYear: num("birthYear") != null ? Math.round(num("birthYear")!) : null },
            });
            await invalidate(qk.me, ["water"], qk.progress, qk.body);
            toast("Meta atualizada", { tone: "success" });
            onClose();
          } catch (err) {
            toast(errorMessage(err), { tone: "error" });
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input name="weight" label="Peso" suffix="kg" inputMode="decimal" defaultValue={weightKg ?? ""} placeholder="70" hint="Entra no seu peso corporal de hoje." />
          <Input name="height" label="Altura" suffix="cm" inputMode="numeric" defaultValue={u.heightCm ?? ""} placeholder="170" />
        </div>
        <Input name="birthYear" label="Ano de nascimento" inputMode="numeric" defaultValue={u.birthYear ?? ""} placeholder="1999" hint="Usado só para a faixa de idade." />
        <Button type="submit" block loading={saving}>
          Salvar dados
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-5 border-t border-line pt-5">
        <label className="flex items-center gap-3">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Clima quente</span>
            <span className="block text-xs text-text-3">Soma 500 ml na meta diária</span>
          </span>
          <Switch checked={u.hotClimate} onChange={(v) => patch({ hotClimate: v })} label="Clima quente" />
        </label>
        <div>
          <p className="mb-2 px-1 text-sm font-semibold text-text-2">Tamanho do seu copo/garrafa</p>
          <Stepper value={u.cupMl} min={100} max={1500} step={50} label="tamanho do copo" format={(v) => `${v} ml`} onChange={(v) => patch({ cupMl: v })} />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-3 px-1">
            <span className="flex-1 text-sm font-semibold text-text-2">Meta manual</span>
            <Switch
              checked={u.waterGoalMl != null}
              onChange={(v) => patch({ waterGoalMl: v ? 3000 : null })}
              label="Usar meta manual"
            />
          </div>
          {u.waterGoalMl != null ? (
            <Stepper value={u.waterGoalMl} min={500} max={8000} step={250} label="meta manual" format={formatLiters} onChange={(v) => patch({ waterGoalMl: v })} />
          ) : (
            <p className="px-1 text-xs text-text-3">Desligado: a meta é calculada pelo seu peso, idade, altura e treino do dia.</p>
          )}
        </div>
        <Link href="/progresso" className="px-1 text-xs font-semibold text-lilac">
          Ver histórico de peso
        </Link>
      </div>
    </Sheet>
  );
}
