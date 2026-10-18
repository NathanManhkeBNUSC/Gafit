// Shared types between server and client.

export type MuscleGroup =
  | "peito"
  | "costas"
  | "ombros"
  | "biceps"
  | "triceps"
  | "antebraco"
  | "abdomen"
  | "quadriceps"
  | "posterior"
  | "gluteos"
  | "panturrilha"
  | "adutores"
  | "lombar"
  | "trapezio"
  | "cardio"
  | "outros";

export type SetType = "warmup" | "normal" | "drop" | "failure";

export interface PlanExercise {
  id: string;
  exerciseId: string;
  sets: number;
  /** Free text range like "8-12", "15", "até a falha", "30s". */
  reps: string;
  restSec: number;
  /** Suggested load in kg (optional). */
  weight?: number | null;
  notes?: string | null;
  /** Exercises sharing the same letter are performed as a superset/bi-set. */
  group?: string | null;
}

export interface PlanDay {
  id: string;
  name: string; // "Treino A"
  focus?: string | null; // "Peito e tríceps"
  exercises: PlanExercise[];
}

export interface PlanDTO {
  id: string;
  name: string;
  notes: string | null;
  days: PlanDay[];
  isActive: boolean;
  source: string;
  shareCode: string | null;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  weight: number | null;
  reps: number | null;
  type: SetType;
  done: boolean;
  doneAt?: string | null;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  /** Present when this exercise replaced the one in the plan. */
  originalExerciseId?: string | null;
  planExerciseId?: string | null;
  targetReps?: string | null;
  restSec: number;
  notes?: string | null;
  group?: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutData {
  exercises: WorkoutExercise[];
}

export interface PrHit {
  exerciseId: string;
  kind: "weight" | "e1rm" | "volume";
  value: number;
  previous: number | null;
}

export interface WorkoutSummary {
  volume: number;
  sets: number;
  reps: number;
  exercises: number;
  prs: PrHit[];
  groups: Partial<Record<MuscleGroup, number>>;
}

export interface WorkoutDTO {
  id: string;
  planId: string | null;
  dayId: string | null;
  name: string;
  status: "active" | "done";
  data: WorkoutData;
  notes: string | null;
  summary: WorkoutSummary | null;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number | null;
}

export interface CardioDTO {
  id: string;
  workoutId: string | null;
  kind: string;
  durationMin: number;
  distanceKm: number | null;
  calories: number | null;
  avgHr: number | null;
  intensity: string | null;
  incline: number | null;
  notes: string | null;
  performedAt: string;
}

export interface CatalogExercise {
  id: string;
  name: string;
  nameEn: string;
  group: MuscleGroup;
  equipmentKey: string;
  equipment: string;
  target: string;
  secondary: MuscleGroup[];
  custom?: boolean;
  videoUrl?: string | null;
}

export interface ExerciseDetail extends CatalogExercise {
  gif: string | null;
  secondaryMuscles: string[];
  instructions: string[];
  instructionsLang: "pt" | "en";
  notes?: string | null;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  weeklyGoal: number;
  restDefaultSec: number;
  heightCm: number | null;
  birthYear: number | null;
  hotClimate: boolean;
  cupMl: number;
  waterGoalMl: number | null;
}

/** Draft produced by the importers before the user reviews and saves it. */
export interface DraftExercise {
  exerciseId: string | null;
  rawName: string;
  sets: number;
  reps: string;
  restSec: number;
  weight?: number | null;
  notes?: string | null;
  candidates: string[];
}

export interface DraftDay {
  name: string;
  focus?: string | null;
  exercises: DraftExercise[];
}

export interface DraftPlan {
  name: string;
  notes?: string | null;
  days: DraftDay[];
  warnings: string[];
  usedAi: boolean;
}
