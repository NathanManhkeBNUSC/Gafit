"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { api, errorMessage } from "@/lib/client/api";
import { Logo } from "./logo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    try {
      await api(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        json: Object.fromEntries(f.entries()),
      });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : mode === "signup" ? "/fichas?bemvindo=1" : "/");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <Logo className="mb-10" />
      <h1 className="text-3xl font-extrabold">{mode === "login" ? "Bora treinar." : "Crie sua conta"}</h1>
      <p className="mt-2 text-text-2">
        {mode === "login" ? "Entre para ver sua ficha e suas cargas." : "Sua ficha, suas cargas e seu progresso, num lugar só."}
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        {mode === "signup" && <Input name="name" label="Seu nome" autoComplete="given-name" required placeholder="Como te chamam" />}
        <Input name="email" type="email" label="E-mail" autoComplete="email" inputMode="email" required placeholder="voce@email.com" />
        <Input
          name="password"
          type="password"
          label="Senha"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          placeholder={mode === "signup" ? "Mínimo de 6 caracteres" : ""}
        />
        {mode === "signup" && (
          <Input name="invite" label="Código de convite" hint="Se quem te chamou passou um código, coloque aqui." autoCapitalize="none" />
        )}
        {error && (
          <p role="alert" className="rounded-sm bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-text-2">
        {mode === "login" ? (
          <>
            Ainda não tem conta?{" "}
            <Link className="font-semibold text-rose underline-offset-4 hover:underline" href="/criar-conta">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link className="font-semibold text-rose underline-offset-4 hover:underline" href="/entrar">
              Entrar
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
