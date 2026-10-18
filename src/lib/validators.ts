import { z } from "zod";

const id = z.string().min(1).max(64);

export const planExerciseSchema = z.object({
  id,
  exerciseId: id,
  sets: z.number().int().min(1, "Mínimo de 1 série.").max(20),
  reps: z.string().trim().max(40).default(""),
  restSec: z.number().int().min(0).max(900),
  weight: z.number().min(0).max(2000).nullish(),
  notes: z.string().max(500).nullish(),
  group: z.string().max(4).nullish(),
});

export const planDaySchema = z.object({
  id,
  name: z.string().trim().min(1, "Dê um nome para cada dia.").max(60),
  focus: z.string().trim().max(80).nullish(),
  exercises: z.array(planExerciseSchema).max(40),
});

export const planInputSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome para a ficha.").max(80),
  notes: z.string().max(2000).nullish(),
  days: z.array(planDaySchema).min(1, "A ficha precisa de pelo menos um dia.").max(14),
  source: z.enum(["manual", "text", "image", "template", "shared"]).optional(),
  activate: z.boolean().optional(),
});

const setSchema = z.object({
  id,
  weight: z.number().min(0).max(2000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  type: z.enum(["warmup", "normal", "drop", "failure"]),
  done: z.boolean(),
  doneAt: z.string().nullish(),
});

export const workoutDataSchema = z.object({
  exercises: z
    .array(
      z.object({
        id,
        exerciseId: id,
        originalExerciseId: z.string().nullish(),
        planExerciseId: z.string().nullish(),
        targetReps: z.string().max(40).nullish(),
        restSec: z.number().int().min(0).max(900),
        notes: z.string().max(500).nullish(),
        group: z.string().max(4).nullish(),
        sets: z.array(setSchema).max(30),
      }),
    )
    .max(40),
});

export const workoutUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  notes: z.string().max(2000).nullish(),
  data: workoutDataSchema.optional(),
  startedAt: z.string().optional(),
  durationSec: z.number().int().min(0).max(86400).optional(),
});

export const cardioInputSchema = z.object({
  workoutId: z.string().nullish(),
  kind: z.string().min(1).max(30),
  durationMin: z.number().min(0.5, "Informe a duração.").max(600),
  distanceKm: z.number().min(0).max(500).nullish(),
  calories: z.number().int().min(0).max(10000).nullish(),
  avgHr: z.number().int().min(30).max(250).nullish(),
  intensity: z.enum(["leve", "moderado", "intenso"]).nullish(),
  incline: z.number().min(0).max(40).nullish(),
  notes: z.string().max(500).nullish(),
  performedAt: z.string().optional(),
});
