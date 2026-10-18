"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, Camera, ChevronRight, ClipboardPaste, Flame, HeartPulse, LayoutTemplate, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/card";
import { DayBadge, EmptyState, Skeleton, dayLetter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { WeekStrip } from "@/components/app/week-strip";
import { Logo } from "@/components/app/logo";
import { RecoverySummary } from "@/components/app/recovery";
import { WorkoutRow } from "@/components/app/workout-row";
import { WaterCard } from "@/components/app/water";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useActiveWorkout, useCatalog, useInvalidate, useMe, useNextDay, usePlans, useProgress, useWorkouts } from "@/lib/client/hooks";
import { estimateDayMinutes } from "@/lib/training";

export default function HomePage() {
  const { data: me } = useMe();
  const plans = usePlans();
  const next = useNextDay();
  const active = useActiveWorkout();
  const progress = useProgress();
  const recent = useWorkouts(3);
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidate();
  const [starting, setStarting] = useState(false);

  const firstName = me?.user.name.split(" ")[0];
  const hasPlans = (plans.data?.length ?? 0) > 0;

  async function start() {
    if (!next.data) return;
    setStarting(true);
    try {
      await api("/api/workouts", { method: "POST", json: { planId: next.data.planId, dayId: next.data.day.id } });
      await invalidate(qk.active);
      router.push("/treino");
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
      setStarting(false);
    }
  }

  const p = progress.data;
  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="text-sm text-text-3">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })}</span>
      </header>

      <h1 className="text-3xl font-extrabold">{firstName ? `Oi, ${firstName}` : <Skeleton className="h-9 w-40" />}</h1>

      {/* Today */}
      <div className="mt-5">
        {active.data ? (
          <Card className="relative overflow-hidden p-5">
            <h2 className="text-2xl font-extrabold">{active.data.name}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-2">
              <span className="size-2 animate-pulse rounded-full bg-rose" aria-hidden />
              <span>
                <span className="font-semibold text-rose">Em andamento</span> ·{" "}
                {active.data.data.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)} de{" "}
                {active.data.data.exercises.reduce((a, e) => a + e.sets.length, 0)} séries feitas
              </span>
            </p>
            <Button href="/treino" size="lg" block className="mt-5" icon={<ArrowRight className="size-5" />}>
              Continuar treino
            </Button>
          </Card>
        ) : plans.isLoading || next.isLoading ? (
          <Skeleton className="h-52 rounded-lg" />
        ) : next.data ? (
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <DayBadge index={next.data.index} label={dayLetter(next.data.day.name, next.data.index)} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-extrabold leading-tight">{next.data.day.focus || next.data.day.name}</h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-2">
                  <span className="font-semibold text-text">Hoje</span>
                  <span>{next.data.day.exercises.length} exercícios</span>
                  <span className="flex items-center gap-1">
                    <Timer className="size-3.5" aria-hidden /> ~{estimateDayMinutes(next.data.day.exercises)} min
                  </span>
                </p>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-1 border-t border-line pt-4 text-sm text-text-2">
              {next.data.day.exercises.slice(0, 4).map((e) => (
                <ExerciseLine key={e.id} id={e.exerciseId} sets={e.sets} reps={e.reps} />
              ))}
              {next.data.day.exercises.length > 4 && <li className="text-text-3">+ {next.data.day.exercises.length - 4} exercícios</li>}
            </ul>
            <Button size="lg" block className="mt-5" loading={starting} onClick={start}>
              Começar {next.data.day.name}
            </Button>
            <Link href="/treino" className="mt-3 block text-center text-sm font-semibold text-text-2 hover:text-text">
              Treinar outro dia
            </Link>
          </Card>
        ) : !hasPlans ? (
          <FirstPlan />
        ) : (
          <EmptyState title="Sua ficha ativa está vazia" action={<Button href="/fichas">Abrir fichas</Button>}>
            Adicione exercícios a um dia da ficha para começar.
          </EmptyState>
        )}
      </div>

      <Section title="Sua semana" className="mt-8">
        <Card className="p-4">
          {p ? (
            <>
              <WeekStrip trained={p.weekDays} />
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-text-2">
                  <strong className="text-text">{p.weekCount}</strong> de {p.weeklyGoal} treinos na meta
                </span>
                {p.weekStreak > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-peach">
                    <Flame className="size-4" aria-hidden />
                    {p.weekStreak} {p.weekStreak === 1 ? "semana" : "semanas"} na meta
                  </span>
                )}
              </div>
            </>
          ) : (
            <Skeleton className="h-24" />
          )}
        </Card>
      </Section>

      <Section title="Água hoje">
        <WaterCard />
      </Section>

      {p && p.recovery.some((r) => r.hoursSince !== null) && (
        <Section title="Recuperação" action={<Link href="/progresso#recuperacao" className="text-sm font-semibold text-lilac">Ver tudo</Link>}>
          <Card className="p-4">
            <RecoverySummary items={p.recovery} />
          </Card>
        </Section>
      )}

      <Section title="Atalhos">
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/cardio" icon={<HeartPulse className="size-5" />} label="Registrar cardio" />
          <QuickLink href="/exercicios" icon={<BookOpen className="size-5" />} label="Exercícios" />
        </div>
      </Section>

      {(recent.data?.length ?? 0) > 0 && (
        <Section title="Últimos treinos" action={<Link href="/historico" className="text-sm font-semibold text-lilac">Histórico</Link>}>
          <div className="flex flex-col gap-2">
            {recent.data!.map((w) => (
              <WorkoutRow key={w.id} w={w} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}


function ExerciseLine({ id, sets, reps }: { id: string; sets: number; reps: string }) {
  const { byId } = useCatalog();
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="truncate">{byId.get(id)?.name ?? "…"}</span>
      <span className="tabular shrink-0 text-text-3">
        {sets}×{reps || "–"}
      </span>
    </li>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg bg-surface p-4 font-semibold transition-colors hover:bg-surface-2">
      <span className="flex size-10 items-center justify-center rounded-full bg-lilac-soft text-lilac">{icon}</span>
      <span className="text-sm leading-tight">{label}</span>
    </Link>
  );
}

function FirstPlan() {
  return (
    <Card className="p-5">
      <h2 className="text-2xl font-extrabold">Traga sua ficha</h2>
      <p className="mt-1 text-sm text-text-2">Comece pelo jeito mais fácil pra você. Depois dá pra editar tudo.</p>
      <div className="mt-5 flex flex-col gap-2">
        <FirstOption href="/fichas/importar?modo=foto" icon={<Camera className="size-5" />} title="Foto ou PDF da ficha" text="A IA lê a ficha do personal" />
        <FirstOption href="/fichas/importar" icon={<ClipboardPaste className="size-5" />} title="Colar o texto" text="Do bloco de notas ou WhatsApp" />
        <FirstOption href="/fichas/nova" icon={<Plus className="size-5" />} title="Montar do zero" text="Escolha os exercícios na biblioteca" />
        <FirstOption href="/fichas/modelos" icon={<LayoutTemplate className="size-5" />} title="Usar um modelo pronto" text="ABC, full body, glúteos e mais" />
      </div>
    </Card>
  );
}

function FirstOption({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md bg-surface-2 p-3.5 transition-colors hover:bg-surface-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-text-3">{text}</span>
      </span>
      <ChevronRight className="size-5 text-text-3" aria-hidden />
    </Link>
  );
}
