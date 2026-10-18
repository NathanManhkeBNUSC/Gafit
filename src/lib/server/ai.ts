import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODEL = () => process.env.AI_MODEL || "claude-sonnet-5-5";
const FAST_MODEL = () => process.env.AI_FAST_MODEL || "claude-haiku-5-5";

let client: Anthropic | null = null;
function ai() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface AiPlan {
  name?: string;
  notes?: string;
  days: {
    name: string;
    focus?: string;
    exercises: {
      name_pt: string;
      name_en?: string;
      sets?: number;
      reps?: string;
      rest_sec?: number;
      weight_kg?: number;
      notes?: string;
      superset?: string;
    }[];
  }[];
}

const PLAN_PROMPT = `Você recebe uma ficha de treino de academia (pode ser texto, foto ou PDF, às vezes manuscrita).
Extraia a ficha COMPLETA e responda APENAS com um JSON válido, sem texto antes ou depois, no formato:
{"name": "nome curto da ficha", "notes": "observações gerais ou vazio",
 "days": [{"name": "Treino A", "focus": "Peito e tríceps",
   "exercises": [{"name_pt": "Supino reto com barra", "name_en": "barbell bench press", "sets": 4, "reps": "8-12",
                  "rest_sec": 90, "weight_kg": 40, "notes": "", "superset": ""}]}]}
Regras:
- Mantenha a ordem dos dias e dos exercícios exatamente como na ficha.
- "name_pt" é o nome do exercício como é chamado em academias brasileiras; "name_en" é o nome equivalente em inglês (ex.: "lat pulldown", "leg press", "cable triceps pushdown with rope").
- "reps" é texto: "12", "8-12", "12/10/8", "até a falha", "30s".
- Se a ficha não disser séries, use 3; se não disser descanso, use 60. Omita weight_kg se não houver carga.
- Bi-set/tri-set: dê a mesma letra em "superset" (ex.: "A") para os exercícios agrupados.
- Se não houver divisão por dias, crie um único dia "Treino A".
- Ignore cabeçalhos da academia, nome do aluno, datas e assinaturas.`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("A IA não devolveu um JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

type Media = { kind: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string } | { kind: "pdf"; data: string };

export async function aiReadPlan(input: { text?: string; files?: Media[] }): Promise<AiPlan> {
  const content: Anthropic.ContentBlockParam[] = [];
  for (const f of input.files ?? []) {
    if (f.kind === "pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
    else content.push({ type: "image", source: { type: "base64", media_type: f.mediaType, data: f.data } });
  }
  content.push({ type: "text", text: input.text ? `${PLAN_PROMPT}\n\nFicha:\n${input.text}` : PLAN_PROMPT });
  const res = await ai().messages.create({
    model: MODEL(),
    max_tokens: 8000,
    messages: [{ role: "user", content }],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const parsed = extractJson(text) as AiPlan;
  if (!parsed || !Array.isArray(parsed.days)) throw new Error("Não consegui entender a ficha.");
  return parsed;
}

export async function aiTranslateSteps(name: string, steps: string[]): Promise<string[]> {
  const res = await ai().messages.create({
    model: FAST_MODEL(),
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Traduza para português do Brasil, com vocabulário de academia, os passos de execução do exercício "${name}".
Mantenha o mesmo número de passos, frases curtas e no imperativo (você). Responda só com um JSON: {"steps": ["..."]}.

${JSON.stringify(steps)}`,
      },
    ],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const parsed = extractJson(text) as { steps?: string[] };
  if (!parsed.steps?.length) throw new Error("Tradução vazia.");
  return parsed.steps.map(String);
}
