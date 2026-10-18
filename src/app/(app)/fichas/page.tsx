"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, Camera, Check, ChevronRight, ClipboardPaste, Copy, KeyRound, LayoutTemplate, MoreHorizontal, Plus, Share2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { DayBadge, EmptyState, Skeleton, dayLetter } from "@/components/ui/misc";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useInvalidate, usePlans } from "@/lib/client/hooks";
import { useQueryFlag } from "@/lib/client/use-client";
import type { PlanDTO } from "@/lib/types";

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans();
  const welcome = useQueryFlag("bemvindo");
  const [newChoice, setNewOpen] = useState<boolean | null>(null);
  const newOpen = newChoice ?? (welcome && !isLoading && !plans?.length);

  return (
    <div>
      <PageHeader
        title="Fichas"
        actions={
          <Link href="/exercicios" className="flex h-10 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-semibold text-text-2 hover:text-text">
            <BookOpen className="size-4" /> Exercícios
          </Link>
        }
      />
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ) : !plans?.length ? (
        <EmptyState
          icon={<LayoutTemplate className="size-6" />}
          title="Nenhuma ficha ainda"
          action={
            <Button onClick={() => setNewOpen(true)} icon={<Plus className="size-5" />}>
              Adicionar ficha
            </Button>
          }
        >
          Importe a ficha do seu personal, monte a sua ou comece de um modelo.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
          <Button variant="soft" size="lg" block icon={<Plus className="size-5" />} onClick={() => setNewOpen(true)}>
            Nova ficha
          </Button>
        </div>
      )}

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title={welcome ? "Bem-vindo(a)! Traga sua ficha" : "Nova ficha"}>
        <div className="flex flex-col gap-2">
          <NewOption href="/fichas/importar?modo=foto" icon={<Camera className="size-5" />} title="Foto ou PDF" text="A IA lê a ficha de papel ou o PDF do personal" />
          <NewOption href="/fichas/importar" icon={<ClipboardPaste className="size-5" />} title="Colar texto" text="Do bloco de notas, WhatsApp ou e-mail" />
          <NewOption href="/fichas/nova" icon={<Plus className="size-5" />} title="Montar do zero" text="Escolha exercícios na biblioteca" />
          <NewOption href="/fichas/modelos" icon={<LayoutTemplate className="size-5" />} title="Modelos prontos" text="Full body, ABC, glúteos, push/pull/legs" />
          <NewOption href="/fichas/codigo" icon={<KeyRound className="size-5" />} title="Código de um amigo" text="Copie a ficha que alguém compartilhou" />
        </div>
      </Sheet>
    </div>
  );
}

function NewOption({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md bg-surface p-3.5 transition-colors hover:bg-surface-2">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-text-3">{text}</span>
      </span>
      <ChevronRight className="size-5 text-text-3" aria-hidden />
    </Link>
  );
}

function PlanCard({ plan }: { plan: PlanDTO }) {
  const [menu, setMenu] = useState(false);
  const [share, setShare] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const invalidate = useInvalidate();
  const total = plan.days.reduce((a, d) => a + d.exercises.length, 0);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg bg-surface">
      <div className="flex items-start gap-2 p-4 pb-2">
        <Link href={`/fichas/${plan.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-bold">{plan.name}</h2>
            {plan.isActive && <Badge tone="rose">Ativa</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-text-3">
            {plan.days.length} {plan.days.length === 1 ? "dia" : "dias"} · {total} exercícios
          </p>
        </Link>
        <IconButton label={`Opções de ${plan.name}`} onClick={() => setMenu(true)}>
          <MoreHorizontal className="size-5" />
        </IconButton>
      </div>
      <Link href={`/fichas/${plan.id}`} className="flex flex-col gap-1 px-4 pb-4">
        {plan.days.map((d, i) => (
          <div key={d.id} className="flex items-center gap-3 rounded-md py-1.5">
            <DayBadge index={i} label={dayLetter(d.name, i)} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="font-semibold">{d.name}</span>
              {d.focus && <span className="text-text-3"> · {d.focus}</span>}
            </span>
            <span className="tabular text-xs text-text-3">{d.exercises.length} ex.</span>
          </div>
        ))}
      </Link>

      <Sheet open={menu} onClose={() => setMenu(false)} title={plan.name}>
        <div className="flex flex-col gap-2">
          {!plan.isActive && (
            <Button
              block
              icon={<Check className="size-4" />}
              loading={busy}
              onClick={() =>
                run(async () => {
                  await api(`/api/plans/${plan.id}/activate`, { method: "POST" });
                  await invalidate(qk.plans, qk.next);
                  setMenu(false);
                  toast("Ficha ativada", { tone: "success" });
                })
              }
            >
              Usar como ficha ativa
            </Button>
          )}
          <Button
            variant="secondary"
            block
            icon={<Share2 className="size-4" />}
            loading={busy}
            onClick={() =>
              run(async () => {
                const res = await api<{ code: string }>(`/api/plans/${plan.id}/share`, { method: "POST" });
                await invalidate(qk.plans);
                setMenu(false);
                setShare(res.code);
              })
            }
          >
            Compartilhar com um amigo
          </Button>
          <Button variant="danger" block className="mt-4" icon={<Trash2 className="size-4" />} onClick={() => { setMenu(false); setConfirm(true); }}>
            Excluir ficha
          </Button>
        </div>
      </Sheet>

      <Sheet open={Boolean(share)} onClose={() => setShare(null)} title="Compartilhar ficha">
        <p className="text-text-2">Mande este código pro seu amigo. No Gafit dele: Fichas → Nova ficha → Código de um amigo.</p>
        <div className="font-display tabular my-6 rounded-lg bg-surface-2 py-6 text-center text-4xl font-extrabold tracking-[0.2em] text-rose">{share}</div>
        <Button
          block
          size="lg"
          icon={<Copy className="size-5" />}
          onClick={async () => {
            const textMsg = `Minha ficha "${plan.name}" no Gafit. Código: ${share}`;
            try {
              if (navigator.share) await navigator.share({ text: textMsg });
              else {
                await navigator.clipboard.writeText(share!);
                toast("Código copiado", { tone: "success" });
              }
            } catch {}
          }}
        >
          Enviar código
        </Button>
      </Sheet>

      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Excluir ficha?"
        message={`“${plan.name}” será apagada. Seus treinos registrados continuam no histórico.`}
        confirmLabel="Excluir ficha"
        danger
        loading={busy}
        onConfirm={() =>
          run(async () => {
            await api(`/api/plans/${plan.id}`, { method: "DELETE" });
            await invalidate(qk.plans, qk.next);
            setConfirm(false);
            toast("Ficha excluída");
          })
        }
      />
    </div>
  );
}
