"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Droplet, LogOut, Moon, Smartphone, Sparkles, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/card";
import { Segmented } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/misc";
import { Stepper } from "@/components/ui/stepper";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/client/api";
import { qk, useInvalidate, useMe } from "@/lib/client/hooks";
import { restLabel } from "@/components/app/plan-editor";
import { useQueryClient } from "@tanstack/react-query";

type Theme = "dark" | "light" | "system";

export default function ProfilePage() {
  const { data } = useMe();
  const toast = useToast();
  const invalidate = useInvalidate();
  const router = useRouter();
  const qc = useQueryClient();
  const [theme, setTheme] = useState<Theme>(() => (typeof window === "undefined" ? "dark" : (localStorage.getItem("gafit-theme") as Theme) || "dark"));
  const [pw, setPw] = useState({ current: "", next: "" });
  const [savingPw, setSavingPw] = useState(false);

  async function patch(body: Record<string, unknown>, msg = "Salvo") {
    try {
      await api("/api/me", { method: "PATCH", json: body });
      await invalidate(qk.me, qk.progress);
      toast(msg, { tone: "success" });
    } catch (e) {
      toast(errorMessage(e), { tone: "error" });
    }
  }

  if (!data) return <Skeleton className="mt-16 h-96 rounded-lg" />;
  const u = data.user;

  return (
    <div>
      <PageHeader title="Perfil" subtitle={u.email} />

      <Card className="p-4">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
            if (name && name !== u.name) patch({ name });
          }}
        >
          <Input name="name" label="Nome" defaultValue={u.name} className="flex-1" />
          <Button type="submit" variant="secondary">
            Salvar
          </Button>
        </form>
      </Card>

      <Section title="Treino">
        <Card className="flex flex-col gap-5 p-4">
          <div>
            <p className="mb-2 px-1 text-sm font-semibold text-text-2">Meta de treinos por semana</p>
            <Stepper value={u.weeklyGoal} min={1} max={7} label="treinos por semana" format={(v) => `${v}x por semana`} onChange={(v) => patch({ weeklyGoal: v }, "Meta atualizada")} />
          </div>
          <div>
            <p className="mb-2 px-1 text-sm font-semibold text-text-2">Descanso padrão (exercícios avulsos)</p>
            <Stepper value={u.restDefaultSec} min={15} max={300} step={15} label="descanso padrão" format={restLabel} onChange={(v) => patch({ restDefaultSec: v }, "Descanso atualizado")} />
          </div>
        </Card>
      </Section>

      <Section title="Água">
        <Link href="/agua" className="flex items-center gap-3 rounded-lg bg-surface p-4 hover:bg-surface-2">
          <span className="flex size-10 items-center justify-center rounded-full bg-water-soft text-water">
            <Droplet className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Meta de água</span>
            <span className="block text-xs text-text-3">
              {u.heightCm ? `${u.heightCm} cm` : "Altura não informada"} · {u.birthYear ? `${new Date().getFullYear() - u.birthYear} anos` : "idade não informada"}
              {u.hotClimate ? " · clima quente" : ""}
            </span>
          </span>
          <ChevronRight className="size-5 text-text-3" aria-hidden />
        </Link>
      </Section>

      <Section title="Aparência">
        <Segmented
          label="Tema"
          value={theme}
          onChange={(t) => {
            setTheme(t);
            localStorage.setItem("gafit-theme", t);
            document.documentElement.dataset.theme = t;
          }}
          options={[
            { value: "dark", label: "Escuro" },
            { value: "light", label: "Claro" },
            { value: "system", label: "Sistema" },
          ]}
        />
        <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-text-3">
          {theme === "dark" ? <Moon className="size-3.5" /> : theme === "light" ? <Sun className="size-3.5" /> : <Smartphone className="size-3.5" />}
          {theme === "system" ? "Segue o tema do celular." : theme === "light" ? "Melhor sob luz forte." : "Confortável em academia mais escura."}
        </p>
      </Section>

      <Section title="Senha">
        <Card className="p-4">
          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingPw(true);
              await patch({ currentPassword: pw.current, newPassword: pw.next }, "Senha alterada");
              setPw({ current: "", next: "" });
              setSavingPw(false);
            }}
          >
            <Input type="password" label="Senha atual" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <Input type="password" label="Nova senha" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} hint="Mínimo de 6 caracteres." />
            <Button type="submit" variant="secondary" loading={savingPw} disabled={!pw.current || pw.next.length < 6}>
              Alterar senha
            </Button>
          </form>
        </Card>
      </Section>

      <Section title="Sobre">
        <Card className="flex flex-col gap-2 p-4 text-sm text-text-2">
          <p className="flex items-center gap-2">
            <Sparkles className="size-4 text-lilac" />
            Leitura de ficha por foto/PDF: {data.features.ai ? <strong className="text-mint">ativada</strong> : <strong className="text-text-3">desativada</strong>}
          </p>
          <p className="text-xs text-text-3">Instale o Gafit na tela inicial: no Chrome, menu ⋮ → “Instalar app”; no iPhone, Compartilhar → “Adicionar à Tela de Início”.</p>
          <p className="text-xs text-text-3">Demonstrações dos exercícios: ExerciseDB · © Gym visual.</p>
        </Card>
      </Section>

      <Button
        variant="ghost"
        block
        className="mt-8"
        icon={<LogOut className="size-4" />}
        onClick={async () => {
          await api("/api/auth/logout", { method: "POST" });
          qc.clear();
          router.replace("/entrar");
        }}
      >
        Sair
      </Button>
    </div>
  );
}
