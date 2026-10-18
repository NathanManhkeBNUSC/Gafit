import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  date,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { PlanDay, WorkoutData, WorkoutSummary } from "@/lib/types";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    weeklyGoal: integer("weekly_goal").notNull().default(3),
    restDefaultSec: integer("rest_default_sec").notNull().default(90),
    heightCm: integer("height_cm"),
    birthYear: integer("birth_year"),
    hotClimate: boolean("hot_climate").notNull().default(false),
    cupMl: integer("cup_ml").notNull().default(250),
    waterGoalMl: integer("water_goal_ml"), // manual override; null = calculated
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/** A workout plan ("ficha"). Days and their exercises live in `days` (JSONB) so the editor saves in one write. */
export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
    days: jsonb("days").$type<PlanDay[]>().notNull(),
    isActive: boolean("is_active").notNull().default(false),
    source: text("source").notNull().default("manual"),
    shareCode: text("share_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("plans_user_idx").on(t.userId), uniqueIndex("plans_share_idx").on(t.shareCode)],
);

/** A training session. Live state is kept in `data`; finished sessions are also flattened into set_logs. */
export const workouts = pgTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id"),
    dayId: text("day_id"),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"), // active | done
    data: jsonb("data").$type<WorkoutData>().notNull(),
    notes: text("notes"),
    summary: jsonb("summary").$type<WorkoutSummary>(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationSec: integer("duration_sec"),
  },
  (t) => [index("workouts_user_idx").on(t.userId, t.startedAt)],
);

export const setLogs = pgTable(
  "set_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull(),
    exerciseIndex: integer("exercise_index").notNull(),
    setIndex: integer("set_index").notNull(),
    setType: text("set_type").notNull().default("normal"),
    weight: real("weight").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    e1rm: real("e1rm").notNull().default(0),
    volume: real("volume").notNull().default(0),
  },
  (t) => [
    index("set_logs_user_ex_idx").on(t.userId, t.exerciseId, t.performedAt),
    index("set_logs_workout_idx").on(t.workoutId),
  ],
);

export const cardioLogs = pgTable(
  "cardio_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workoutId: text("workout_id"),
    kind: text("kind").notNull(),
    durationMin: real("duration_min").notNull(),
    distanceKm: real("distance_km"),
    calories: integer("calories"),
    avgHr: integer("avg_hr"),
    intensity: text("intensity"), // leve | moderado | intenso
    incline: real("incline"),
    notes: text("notes"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cardio_user_idx").on(t.userId, t.performedAt)],
);

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    weightKg: real("weight_kg").notNull(),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("body_user_day_idx").on(t.userId, t.day)],
);

export const customExercises = pgTable(
  "custom_exercises",
  {
    id: text("id").primaryKey(), // "c_..."
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    group: text("muscle_group").notNull(),
    equipment: text("equipment"),
    videoUrl: text("video_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("custom_ex_user_idx").on(t.userId)],
);

/** Cache of AI translations of exercise instructions (shared by every user). */
export const exerciseTranslations = pgTable(
  "exercise_translations",
  {
    exerciseId: text("exercise_id").notNull(),
    lang: text("lang").notNull(),
    steps: jsonb("steps").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.lang] })],
);

/** Water intake, one row per drink. `day` is the user's local calendar day. */
export const waterLogs = pgTable(
  "water_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    amountMl: integer("amount_ml").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("water_user_day_idx").on(t.userId, t.day)],
);
