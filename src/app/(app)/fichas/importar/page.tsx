"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, FileText, ImagePlus, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, errorMessage } from "@/lib/client/api";
import { saveDraft } from "@/lib/client/draft";
import { useMe } from "@/lib/client/hooks";
import { useQueryFlag } from "@/lib/client/use-client";
import type { DraftPlan } from "@/lib/types";

const EXAMPLE = `Treino A - Peito e tríceps
Supino reto 4x10-12
Supino inclinado halteres 3x12 (90s)
Crucifixo máquina 3x15
Tríceps corda 3x12

Treino B - Costas e bíceps
Puxada alta 4x10
Remada baixa 4x10
Rosca direta 3x10`;

/** Downscale phone photos so uploads stay small and fast (sheets read fine at ~1600px). */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 900_000) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

export default function ImportPage() {
  const photoFirst = useQueryFlag("modo", "foto");
  const [modeChoice, setMode] = useState<"texto" | "foto" | null>(null);
  const mode = modeChoice ?? (photoFirst ? "foto" : "texto");
  const [text, setText] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: me } = useMe();
  const ai = me?.features.ai ?? false;
  const router = useRouter();
  const toast = useToast();

  function done(draft: DraftPlan, source: "text" | "image") {
    const total = draft.days.reduce((a, d) => a + d.exercises.length, 0);
    if (!total) {
      setError(draft.warnings[0] ?? "Não encontrei exercícios.");
      return;
    }
    saveDraft(draft, source);
    const missing = draft.days.reduce((a, d) => a + d.exercises.filter((e) => !e.exerciseId).length, 0);
    toast(missing ? `Li ${total} exercícios · ${missing} pra conferir` : `Li ${total} exercícios em ${draft.days.length} dias`, { tone: "success" });
    router.push("/fichas/nova?rascunho=1");
  }

  async function readText() {
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ draft: DraftPlan }>("/api/import/text", { method: "POST", json: { text, useAi: ai && useAi } });
      done(res.draft, "text");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function readFiles() {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", await shrinkImage(f));
      const res = await fetch("/api/import/file", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(res.status, json.error ?? "Não consegui ler a ficha.");
      done(json.draft as DraftPlan, "image");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Importar ficha" back="/fichas" subtitle="Traga a ficha que você já segue. Você revisa tudo antes de salvar." />
      <Segmented
        label="Como importar"
        value={mode}
        onChange={(v) => {
          setMode(v);
          setError(null);
        }}
        options={[
          { value: "texto", label: "Colar texto" },
          { value: "foto", label: "Foto ou PDF" },
        ]}
      />

      {mode === "texto" ? (
        <div className="mt-5 flex flex-col gap-4">
          <Textarea
            label="Texto da ficha"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLE}
            rows={12}
            hint="Um exercício por linha, com séries x repetições. Separe os dias com “Treino A”, “Treino B”…"
          />
          {ai && (
            <label className="flex items-center gap-3 rounded-md bg-surface p-4">
              <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="size-5 accent-[var(--rose)]" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-4 text-lilac" /> Interpretar com IA
                </span>
                <span className="block text-xs text-text-3">Para fichas bagunçadas ou fora do padrão. Mais lento.</span>
              </span>
            </label>
          )}
          {error && <ErrorBox message={error} />}
          <Button size="lg" block loading={loading} disabled={text.trim().length < 3} onClick={readText} icon={<FileText className="size-5" />}>
            Ler ficha
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {!ai && (
            <div className="rounded-md bg-peach-soft p-4 text-sm text-peach">
              A leitura de foto/PDF usa IA e precisa da chave <code className="font-semibold">ANTHROPIC_API_KEY</code> configurada no servidor. Enquanto isso, use “Colar texto”.
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-line-strong bg-surface px-6 py-10 text-center transition-colors hover:border-rose-line">
            <span className="flex size-14 items-center justify-center rounded-full bg-rose-soft text-rose">
              <Camera className="size-6" />
            </span>
            <span className="font-semibold">Tirar foto ou escolher arquivo</span>
            <span className="text-sm text-text-3">Foto da ficha de papel, print do WhatsApp ou PDF. Até 5 arquivos.</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="sr-only"
              disabled={!ai}
              onChange={(e) => {
                setFiles((xs) => [...xs, ...Array.from(e.target.files ?? [])].slice(0, 5));
                e.target.value = "";
              }}
            />
          </label>
          {files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-3 rounded-md bg-surface p-3 text-sm">
                  <ImagePlus className="size-5 text-text-3" />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <button type="button" aria-label={`Remover ${f.name}`} onClick={() => setFiles((xs) => xs.filter((_, j) => j !== i))} className="flex size-8 items-center justify-center rounded-full text-text-3 hover:text-text">
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <ErrorBox message={error} />}
          <Button size="lg" block loading={loading} disabled={!files.length || !ai} onClick={readFiles} icon={<Sparkles className="size-5" />}>
            {loading ? "Lendo a ficha…" : "Ler com IA"}
          </Button>
          <p className="text-center text-xs text-text-3">Dica: foto reta, bem iluminada e com a ficha inteira no quadro.</p>
        </div>
      )}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-sm bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
      {message}
    </p>
  );
}
