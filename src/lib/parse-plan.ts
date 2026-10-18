/**
 * Heuristic parser for workout sheets pasted as text, the way people keep them in notes apps:
 *
 *   TREINO A - Peito e tríceps
 *   1. Supino reto 4x10-12 (90s)
 *   2. Crucifixo inclinado 3x12 20kg
 *   Tríceps corda + tríceps francês 3x12   (bi-set)
 *
 * It never invents exercises; anything it cannot read becomes a warning for the user to review.
 */

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number | null;
  weight: number | null;
  notes: string | null;
  superset: string | null;
}

export interface ParsedDay {
  name: string;
  focus: string | null;
  exercises: ParsedExercise[];
}

export interface ParsedPlan {
  title: string | null;
  days: ParsedDay[];
  warnings: string[];
}

const WEEKDAYS = ["segunda", "terca", "terça", "quarta", "quinta", "sexta", "sabado", "sábado", "domingo"];

const HEADER_RE =
  /^(?:treino|dia|ficha|day|workout|rotina)\s*([a-z0-9]{1,2})\b\s*[-–—:.)]?\s*(.*)$/i;
const LETTER_HEADER_RE = /^([A-F])\s*[-–—:.)]\s*(.*)$/; // "A - Peito"
const PPL_RE = /^(push|pull|legs|upper|lower|superiores|inferiores|empurrar|puxar|pernas)\b\s*[-–—:.)]?\s*(.*)$/i;

const SETS_REPS_RE =
  /(\d{1,2})\s*(?:x|×|\*|séries?\s+de|series?\s+de|sets?\s+(?:of|de))\s*(\d{1,3}\s*(?:s|seg|segundos)\b|até a falha|falha|m[aá]x(?:imo)?|\d{1,3}(?:\s*(?:-|a|até|\/|,)\s*\d{1,3})*)/i;
const REPS_ONLY_RE = /(\d{1,3}(?:\s*(?:-|a|\/)\s*\d{1,3})*)\s*(?:reps?|repetiç(?:ões|ao|ão))/i;
const SETS_ONLY_RE = /(\d{1,2})\s*(?:séries?|series?|sets?)\b/i;
const REST_RE = /(?:desc(?:anso)?\.?|intervalo|rest|pausa)?\s*[:(]?\s*(\d{1,3})\s*(s|seg|segundos|"|”)(?![a-z])|(\d)\s*(?:min|minutos?|')\s*(?:(\d{1,2})\s*(?:s|seg|")?)?/i;
const WEIGHT_RE = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg|quilos?|kilos?)\b/i;

function clean(s: string) {
  return s
    .replace(/^[\s\-–—•*·>]+/, "")
    .replace(/^\d{1,2}\s*[.)º°-]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeReps(r: string): string {
  if (/falha/i.test(r)) return "até a falha";
  return r
    .replace(/\s+/g, "")
    .replace(/até/gi, "-")
    .replace(/(\d)a(\d)/gi, "$1-$2")
    .replace(/^falha$|^atéafalha$/i, "até a falha")
    .replace(/^m[aá]x(imo)?$/i, "máximo")
    .replace(/(\d+)(s|seg|segundos)$/i, "$1s");
}

function parseHeader(line: string): { name: string; focus: string | null } | null {
  const l = clean(line).replace(/[:]+$/, "").trim();
  if (!l || SETS_REPS_RE.test(l)) return null;
  let m = l.match(HEADER_RE);
  if (m) {
    const word = l.split(/\s+/)[0];
    const label = `${word[0].toUpperCase()}${word.slice(1).toLowerCase()} ${m[1].toUpperCase()}`;
    return { name: label, focus: m[2]?.replace(/^[-–—:.)\s]+/, "").trim() || null };
  }
  m = l.match(LETTER_HEADER_RE);
  if (m) return { name: `Treino ${m[1].toUpperCase()}`, focus: m[2]?.trim() || null };
  m = l.match(PPL_RE);
  if (m && l.split(/\s+/).length <= 6) {
    const name = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    return { name, focus: m[2]?.trim() || null };
  }
  const first = l.toLowerCase().split(/[\s\-–—:,]+/)[0];
  if (WEEKDAYS.includes(first) && l.split(/\s+/).length <= 6) {
    const rest = l.slice(first.length).replace(/^[\s\-–—:(feira)]+/i, "").trim();
    return { name: first[0].toUpperCase() + first.slice(1), focus: rest || null };
  }
  // A short line ending with ":" and no numbers is a section header ("Pernas:")
  if (/:\s*$/.test(line) && !/\d/.test(l) && l.split(/\s+/).length <= 5) return { name: l, focus: null };
  return null;
}

function parseExercise(line: string, defaultRest: number | null): ParsedExercise[] | null {
  let l = clean(line);
  if (!l || l.length < 3) return null;
  let sets = 0;
  let reps = "";
  let restSec: number | null = null;
  let weight: number | null = null;

  const sr = l.match(SETS_REPS_RE);
  if (sr) {
    sets = Number(sr[1]);
    reps = normalizeReps(sr[2]);
    l = l.replace(sr[0], " ");
  } else {
    const ro = l.match(REPS_ONLY_RE);
    if (ro) {
      reps = normalizeReps(ro[1]);
      l = l.replace(ro[0], " ");
    }
    const so = l.match(SETS_ONLY_RE);
    if (so) {
      sets = Number(so[1]);
      l = l.replace(so[0], " ");
    }
  }
  const w = l.match(WEIGHT_RE);
  if (w) {
    weight = Number(w[1].replace(",", "."));
    l = l.replace(w[0], " ");
  }
  const r = l.match(REST_RE);
  if (r && (r[1] || r[3])) {
    restSec = r[1] ? Number(r[1]) : Number(r[3]) * 60 + Number(r[4] ?? 0);
    l = l.replace(r[0], " ");
  }
  // Notes in parentheses that are not numbers ("(pegada aberta)")
  let notes: string | null = null;
  l = l.replace(/\b(cada (?:lado|perna|braço|braco)|unilateral)\b/i, (m) => {
    notes = m.toLowerCase();
    return " ";
  });
  l = l.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    const t = inner.trim();
    if (t && /[a-zà-ú]{3,}/i.test(t)) notes = notes ? `${notes}; ${t}` : t;
    return " ";
  });
  l = l
    .replace(/\b(?:descanso|intervalo|rest|séries?|series?|reps?|repetições)\b/gi, " ")
    .replace(/[|;:=()]+/g, " ")
    .replace(/[-–—,.]+\s*$/g, "")
    .replace(/^\s*[-–—,.]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!l || !/[a-zà-ú]{3,}/i.test(l)) return null;
  // Lines without any training numbers are only accepted if they look like exercise names (short).
  if (!sets && !reps && l.split(" ").length > 7) return null;

  const base = {
    sets: sets || 3,
    reps: reps || "",
    restSec: restSec ?? defaultRest,
    weight,
    notes,
  };
  // Supersets written on one line: "Rosca direta + tríceps corda"
  const parts = l.split(/\s+\+\s+|\s+(?:conjugado com|e depois|bi-?set com)\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((name) => ({ name, ...base, superset: "*" }));
  }
  return [{ name: l, ...base, superset: null }];
}

export function parsePlanText(text: string): ParsedPlan {
  const warnings: string[] = [];
  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;
  let defaultRest: number | null = null;
  let supersetCount = 0;
  let title: string | null = null;

  const lines = text.replace(/\r/g, "").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Global rest instruction: "Descanso: 60s entre séries"
    if (/^(descanso|intervalo)\b/i.test(clean(line)) && !SETS_REPS_RE.test(line)) {
      const r = line.match(REST_RE);
      if (r && (r[1] || r[3])) defaultRest = r[1] ? Number(r[1]) : Number(r[3]) * 60 + Number(r[4] ?? 0);
      continue;
    }
    // A first line without numbers that is not a day header names the plan ("FICHA HIPERTROFIA")
    if (!days.length && !title && !/\d/.test(line) && /^(ficha|plano|programa)\b|^[^a-z]+$/i.test(clean(line)) && !parseHeader(line)) {
      title = clean(line).replace(/:$/, "");
      if (title === title.toUpperCase()) title = title.charAt(0) + title.slice(1).toLowerCase();
      continue;
    }
    const header = parseHeader(line);
    if (header) {
      current = { ...header, exercises: [] };
      days.push(current);
      continue;
    }
    const ex = parseExercise(line, defaultRest);
    if (!ex) {
      if (clean(line).length > 2) warnings.push(`Linha ignorada: "${clean(line).slice(0, 60)}"`);
      continue;
    }
    if (!current) {
      current = { name: "Treino A", focus: null, exercises: [] };
      days.push(current);
    }
    if (ex.length > 1) {
      const letter = String.fromCharCode(65 + (supersetCount++ % 26));
      ex.forEach((e) => (e.superset = letter));
    }
    current.exercises.push(...ex);
  }
  const nonEmpty = days.filter((d) => d.exercises.length);
  if (days.length !== nonEmpty.length) warnings.push("Alguns dias sem exercícios foram removidos.");
  // Name unnamed / duplicate days in order: Treino A, B, C...
  const seen = new Set<string>();
  nonEmpty.forEach((d, i) => {
    if (seen.has(d.name)) d.name = `Treino ${String.fromCharCode(65 + i)}`;
    seen.add(d.name);
  });
  return { title, days: nonEmpty, warnings };
}
