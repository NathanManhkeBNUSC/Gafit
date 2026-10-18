import type { CatalogExercise } from "@/lib/types";

export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["com", "de", "da", "do", "na", "no", "em", "e", "a", "o", "para", "the", "with", "on"]);

/**
 * Brazilian gym slang -> words used in the catalog names. Applied before matching, so
 * "puxada alta" finds "Puxada frontal", "leg 45" finds "Leg press 45°", etc.
 */
const ALIASES: [RegExp, string][] = [
  [/\bpuxada alta\b|\bpuxada (pela )?frente\b/g, "puxada frontal"],
  [/\bcrucifixo (na )?maquina\b/g, "voador peck deck"],
  [/\bpulldown\b/g, "puxada frontal"],
  [/\bpulley (frente|frontal)\b/g, "puxada frontal"],
  [/\bpuxador\b/g, "puxada"],
  [/\bleg (45|press 45)\b/g, "leg press 45"],
  [/\bleg\b(?! press)/g, "leg press"],
  [/\bextensora\b/g, "cadeira extensora"],
  [/\bflexora deitad[ao]\b/g, "mesa flexora"],
  [/\bflexora sentad[ao]\b/g, "cadeira flexora"],
  [/\bmesa flexora\b/g, "mesa flexora"],
  [/\babdutora\b/g, "cadeira abdutora"],
  [/\badutora\b/g, "cadeira adutora"],
  [/\bpeck ?deck\b|\bpec ?deck\b|\bvoador\b/g, "voador peck deck"],
  [/\btriceps (na )?corda\b/g, "triceps corda"],
  [/\btriceps (no )?pulley\b|\btriceps polia\b|\btriceps barra\b/g, "triceps pulley"],
  [/\btriceps frances\b/g, "triceps frances"],
  [/\btriceps testa\b/g, "triceps testa"],
  [/\btriceps coice\b|\bcoice\b/g, "triceps coice"],
  [/\brosca alternada\b/g, "rosca alternada halteres"],
  [/\brosca scot\b/g, "rosca scott"],
  [/\bremada baixa\b/g, "remada baixa sentada"],
  [/\bremada serrote\b|\bserrote\b/g, "remada unilateral serrote"],
  [/\bremada cavalinho\b|\bt ?bar\b/g, "remada cavalinho"],
  [/\bsupino maquina\b/g, "supino maquina"],
  [/\bsupino reto\b/g, "supino reto"],
  [/\bsupino incl\b|\bsupino inclinado\b/g, "supino inclinado"],
  [/\bsupino decl\b|\bsupino declinado\b/g, "supino declinado"],
  [/\bagachamento livre\b|\bagacho\b/g, "agachamento livre"],
  [/\bbulgaro\b/g, "agachamento bulgaro"],
  [/\bafundo\b/g, "afundo"],
  [/\bpassada\b/g, "avanco caminhando passada"],
  [/\bterra\b/g, "levantamento terra"],
  [/\bstiff\b/g, "stiff"],
  [/\bpanturrilha sentad[ao]\b|\bgemeos sentado\b/g, "panturrilha sentado"],
  [/\bpanturrilha em pe\b|\bgemeos em pe\b|\bgemeos\b/g, "panturrilha em pe"],
  [/\belevacao lateral\b/g, "elevacao lateral"],
  [/\belevacao frontal\b/g, "elevacao frontal"],
  [/\bdesenvolvimento\b/g, "desenvolvimento"],
  [/\bencolhimento\b/g, "encolhimento"],
  [/\bcrucifixo invertido\b|\bcrucifixo inverso\b/g, "crucifixo invertido"],
  [/\bface pull\b/g, "face pull"],
  [/\babdominal supra\b/g, "abdominal supra"],
  [/\binfra\b/g, "elevacao de pernas"],
  [/\bprancha\b/g, "prancha"],
  [/\bhack\b/g, "agachamento hack"],
  [/\bsmith\b/g, "smith"],
  [/\bbarra fixa\b/g, "barra fixa"],
  [/\bparalela(s)?\b/g, "paralelas"],
  [/\bmergulho\b/g, "paralelas"],
  [/\bhip thrust\b|\belevacao pelvica\b/g, "elevacao pelvica"],
  [/\bgluteo (na )?(polia|cabo)\b|\bgluteo coice\b/g, "extensao de quadril polia"],
  [/\bgoblet\b/g, "agachamento goblet"],
  [/\bsumo\b/g, "sumo"],
  [/\bhalter(es)?\b|\bdumbbell\b/g, "halteres"],
  [/\bbarra w\b|\bbarra ez\b/g, "barra w"],
  [/\bcabo\b/g, "polia"],
  [/\bcross ?over\b/g, "crossover"],
];

export function expandQuery(q: string): string {
  let s = ` ${fold(q)} `;
  for (const [re, rep] of ALIASES) s = s.replace(re, ` ${rep} `);
  return s.replace(/\s+/g, " ").trim();
}

function tokens(s: string): string[] {
  return s.split(" ").filter((t) => t && !STOP.has(t));
}

export interface Searchable extends CatalogExercise {
  _fold: string;
  _tokens: string[];
}

export function prepare(list: CatalogExercise[]): Searchable[] {
  return list.map((e) => {
    const f = fold(`${e.name} ${e.nameEn}`);
    return { ...e, _fold: f, _tokens: tokens(fold(e.name)) };
  });
}

/** Popular gym staples get a small boost so short queries show what people actually do. */
const STAPLES = new Set(
  [
    "Supino reto com barra", "Supino inclinado com halteres", "Supino reto com halteres", "Supino inclinado com barra",
    "Crucifixo reto com halteres", "Voador (peck deck)", "Crossover na polia", "Puxada frontal na polia",
    "Remada baixa sentada na polia", "Remada curvada com barra", "Remada unilateral (serrote) com halter",
    "Remada cavalinho (T-bar)", "Barra fixa", "Desenvolvimento sentado com halteres", "Elevação lateral com halteres",
    "Elevação frontal com halteres", "Encolhimento com halteres", "Rosca direta com barra", "Rosca alternada com halteres",
    "Rosca martelo com halteres", "Rosca scott com barra", "Tríceps pulley", "Tríceps corda", "Tríceps testa com barra",
    "Tríceps francês sentado com halter", "Agachamento livre completo com barra", "Leg press 45°", "Cadeira extensora",
    "Mesa flexora", "Cadeira flexora", "Stiff com barra", "Levantamento terra com barra", "Elevação pélvica no banco com barra",
    "Cadeira abdutora", "Cadeira adutora", "Panturrilha em pé na máquina", "Panturrilha sentado (gêmeos sentado)",
    "Abdominal supra no solo", "Prancha frontal com peso", "Agachamento búlgaro com halteres", "Avanço com halteres",
    "Agachamento hack (máquina)", "Face pull na polia com corda", "Desenvolvimento na máquina", "Supino reto na máquina",
    "Agachamento no smith", "Agachamento goblet com halter", "Flexão de braço", "Paralelas para tríceps",
    "Elevação de pernas suspenso", "Crucifixo invertido com halteres", "Pulldown braços estendidos na polia",
  ].map(fold),
);

export function scoreExercise(e: Searchable, qTokens: string[], qFold: string): number {
  if (!qTokens.length) return 0;
  let score = 0;
  let hits = 0;
  for (const t of qTokens) {
    if (e._tokens.includes(t)) {
      score += 3;
      hits++;
    } else if (e._fold.includes(t)) {
      score += t.length >= 4 ? 2 : 1;
      hits++;
    } else if (t.length >= 5 && e._tokens.some((w) => w.startsWith(t.slice(0, 4)))) {
      score += 1;
      hits += 0.5;
    }
  }
  if (hits === 0) return 0;
  const coverage = hits / qTokens.length;
  score *= coverage;
  // Penalize long names that contain many words the query didn't ask for.
  score -= Math.max(0, e._tokens.length - qTokens.length) * 0.35;
  if (e._fold.startsWith(qFold)) score += 2;
  if (STAPLES.has(fold(e.name))) score += 1.5;
  return score;
}

export function searchExercises(list: Searchable[], query: string, limit = 50): Searchable[] {
  const q = expandQuery(query);
  const qTokens = tokens(q);
  if (!qTokens.length) return list.slice(0, limit);
  const scored: [number, Searchable][] = [];
  for (const e of list) {
    const s = scoreExercise(e, qTokens, q);
    if (s > 0.5) scored.push([s, e]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name));
  return scored.slice(0, limit).map((x) => x[1]);
}

export function isStaple(name: string) {
  return STAPLES.has(fold(name));
}
