/**
 * Daily water goal.
 *
 * Base: millilitres per kg of body weight, by age band (common nutrition guidance):
 *   up to 30 years → 40 ml/kg · 31–55 → 35 ml/kg · 56–65 → 30 ml/kg · over 65 → 25 ml/kg
 *   (unknown age → 35 ml/kg)
 * Height: when BMI is above 30, the base uses an adjusted weight
 *   (ideal weight at BMI 22 + 40% of the excess), the usual correction so the goal
 *   doesn't scale with body fat, which holds little water.
 * Training: + 10 ml per minute of workout/cardio done that day (≈ 600 ml per hour).
 * Hot climate: + 500 ml.
 * Rounded to 50 ml and kept between 1.5 L and 6 L. A manual goal replaces all of this.
 */

export interface WaterInputs {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  trainingMin: number;
  hotClimate: boolean;
  manualGoalMl: number | null;
}

export interface WaterLine {
  label: string;
  detail: string;
  ml: number;
}

export interface WaterGoal {
  goalMl: number;
  manual: boolean;
  lines: WaterLine[];
  missing: ("peso" | "altura" | "idade")[];
  /** Weight used in the base (adjusted when BMI > 30). */
  weightUsedKg: number | null;
  bmi: number | null;
}

export function mlPerKg(age: number | null) {
  if (age == null) return 35;
  if (age <= 30) return 40;
  if (age <= 55) return 35;
  if (age <= 65) return 30;
  return 25;
}

const round50 = (n: number) => Math.round(n / 50) * 50;
const fmt = (n: number, d = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: d });

export function waterGoal(i: WaterInputs): WaterGoal {
  const missing: WaterGoal["missing"] = [];
  if (!i.weightKg) missing.push("peso");
  if (!i.heightCm) missing.push("altura");
  if (i.age == null) missing.push("idade");

  const lines: WaterLine[] = [];
  let weightUsed: number | null = i.weightKg;
  let bmi: number | null = null;
  if (i.weightKg && i.heightCm) {
    const m = i.heightCm / 100;
    bmi = Math.round((i.weightKg / (m * m)) * 10) / 10;
    if (bmi > 30) {
      const ideal = 22 * m * m;
      weightUsed = Math.round((ideal + 0.4 * (i.weightKg - ideal)) * 10) / 10;
    }
  }

  const perKg = mlPerKg(i.age);
  // Without weight we fall back to the general 2 L reference so the screen is still useful.
  const base = weightUsed ? round50(weightUsed * perKg) : 2000;
  lines.push(
    weightUsed
      ? {
          label: "Base pelo peso",
          detail:
            weightUsed !== i.weightKg
              ? `${fmt(weightUsed)} kg ajustado pela altura (IMC ${fmt(bmi!)}) × ${perKg} ml`
              : `${fmt(weightUsed)} kg × ${perKg} ml${i.age != null ? ` (${i.age} anos)` : ""}`,
          ml: base,
        }
      : { label: "Referência geral", detail: "Informe seu peso para uma meta sua", ml: base },
  );

  const training = round50(Math.max(0, i.trainingMin) * 10);
  if (training > 0) lines.push({ label: "Treino de hoje", detail: `${Math.round(i.trainingMin)} min de treino e cardio`, ml: training });
  if (i.hotClimate) lines.push({ label: "Clima quente", detail: "Calor aumenta a perda pelo suor", ml: 500 });

  const calculated = Math.min(6000, Math.max(1500, round50(lines.reduce((a, l) => a + l.ml, 0))));
  if (i.manualGoalMl) {
    return { goalMl: i.manualGoalMl, manual: true, lines, missing, weightUsedKg: weightUsed, bmi };
  }
  return { goalMl: calculated, manual: false, lines, missing, weightUsedKg: weightUsed, bmi };
}

export function formatLiters(ml: number) {
  if (ml < 1000) return `${ml} ml`;
  return `${(ml / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L`;
}
