import type { MuscleGroup, PrHit } from "@/lib/types";

export interface RecoveryItem {
  group: MuscleGroup;
  /** 0..1, 1 = fully recovered */
  recovery: number;
  hoursSince: number | null;
  sets: number;
}

export interface ProgressSummary {
  weeklyGoal: number;
  weekCount: number;
  weekDays: string[]; // ISO dates (yyyy-mm-dd) trained this week
  weekStreak: number;
  last30: { workouts: number; volume: number; sets: number; cardioMin: number };
  weeks: { start: string; workouts: number; volume: number; cardioMin: number }[];
  muscleSets7d: Partial<Record<MuscleGroup, number>>;
  recovery: RecoveryItem[];
  recentPrs: (PrHit & { date: string; workoutId: string })[];
  bodyWeight: { day: string; weightKg: number }[];
  topExercises: { exerciseId: string; sessions: number; bestWeight: number }[];
}

export interface ExerciseProgress {
  sessions: {
    workoutId: string;
    date: string;
    bestWeight: number;
    bestReps: number;
    bestE1rm: number;
    volume: number;
    sets: { weight: number; reps: number; type: string }[];
  }[];
  records: { weight: number; e1rm: number; volume: number; reps: number };
}

