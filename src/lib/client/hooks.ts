"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "./api";
import { prepare, type Searchable } from "@/lib/search";
import type {
  CardioDTO,
  CatalogExercise,
  ExerciseDetail,
  MuscleGroup,
  PlanDTO,
  PlanDay,
  UserDTO,
  WorkoutDTO,
} from "@/lib/types";
import type { ProgressSummary, ExerciseProgress } from "@/lib/server/progress-types";
import type { WaterDayDTO } from "@/lib/server/water";

export const qk = {
  me: ["me"] as const,
  plans: ["plans"] as const,
  plan: (id: string) => ["plan", id] as const,
  next: ["next"] as const,
  active: ["workout", "active"] as const,
  workout: (id: string) => ["workout", id] as const,
  workouts: ["workouts"] as const,
  progress: ["progress"] as const,
  catalog: ["catalog"] as const,
  custom: ["custom-exercises"] as const,
  exercise: (id: string) => ["exercise", id] as const,
  history: (id: string) => ["exercise-history", id] as const,
  last: (ids: string[]) => ["last", ids.join(",")] as const,
  cardio: ["cardio"] as const,
  body: ["body"] as const,
  templates: ["templates"] as const,
  water: (day: string) => ["water", day] as const,
};

export function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useWater(day: string) {
  return useQuery({
    queryKey: qk.water(day),
    queryFn: () => api<WaterDayDTO>(`/api/water?day=${day}&tz=${new Date().getTimezoneOffset()}`),
  });
}

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<{ user: UserDTO; features: { ai: boolean } }>("/api/me"),
    staleTime: 5 * 60_000,
  });
}

export function usePlans() {
  return useQuery({ queryKey: qk.plans, queryFn: async () => (await api<{ plans: PlanDTO[] }>("/api/plans")).plans });
}

export function usePlan(id: string | null) {
  return useQuery({
    queryKey: qk.plan(id ?? ""),
    queryFn: async () => (await api<{ plan: PlanDTO }>(`/api/plans/${id}`)).plan,
    enabled: Boolean(id),
  });
}

export interface NextDay {
  planId: string;
  planName: string;
  day: PlanDay;
  index: number;
  total: number;
}

export function useNextDay() {
  return useQuery({ queryKey: qk.next, queryFn: async () => (await api<{ next: NextDay | null }>("/api/workouts/next")).next ?? null });
}

export function useActiveWorkout() {
  return useQuery({
    queryKey: qk.active,
    queryFn: async () => (await api<{ workout: WorkoutDTO | null }>("/api/workouts/active")).workout ?? null,
    staleTime: 30_000,
  });
}

export function useWorkouts(limit = 30) {
  return useQuery({
    queryKey: [...qk.workouts, limit],
    queryFn: async () => (await api<{ workouts: WorkoutDTO[] }>(`/api/workouts?limit=${limit}`)).workouts,
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: qk.workout(id),
    queryFn: () => api<{ workout: WorkoutDTO; cardio: CardioDTO[] }>(`/api/workouts/${id}`),
  });
}

export function useProgress() {
  return useQuery({
    queryKey: qk.progress,
    queryFn: async () =>
      (await api<{ summary: ProgressSummary }>(`/api/progress?tz=${new Date().getTimezoneOffset()}`)).summary,
  });
}

export function useExercise(id: string | null) {
  return useQuery({
    queryKey: qk.exercise(id ?? ""),
    queryFn: async () => (await api<{ exercise: ExerciseDetail }>(`/api/exercises/${id}`)).exercise,
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useExerciseHistory(id: string | null) {
  return useQuery({
    queryKey: qk.history(id ?? ""),
    queryFn: async () => (await api<{ progress: ExerciseProgress }>(`/api/exercises/${id}/history`)).progress,
    enabled: Boolean(id),
  });
}

export type LastPerformance = Record<string, { date: string; sets: { weight: number; reps: number; type: string }[] }>;

export function useLastPerformance(ids: string[], exclude?: string) {
  const sorted = useMemo(() => [...new Set(ids)].sort(), [ids]);
  return useQuery({
    queryKey: [...qk.last(sorted), exclude ?? ""],
    queryFn: async () =>
      (await api<{ last: LastPerformance }>(`/api/exercises/last?ids=${sorted.join(",")}${exclude ? `&exclude=${exclude}` : ""}`)).last,
    enabled: sorted.length > 0,
    staleTime: 5 * 60_000,
  });
}

export function useCardio() {
  return useQuery({ queryKey: qk.cardio, queryFn: async () => (await api<{ cardio: CardioDTO[] }>("/api/cardio")).cardio });
}

export function useBody() {
  return useQuery({
    queryKey: qk.body,
    queryFn: async () => (await api<{ entries: { id: string; day: string; weightKg: number; notes: string | null }[] }>("/api/body")).entries,
  });
}

/** Catalog (static JSON, cached for the session) merged with the user's own exercises. */
export function useCatalog() {
  const base = useQuery({
    queryKey: qk.catalog,
    queryFn: async () => {
      const res = await fetch("/catalog.json");
      const json = (await res.json()) as { rows: [string, string, string, string, string, string, string, string][] };
      return json.rows.map(
        ([id, name, nameEn, group, equipmentKey, equipment, target, secondary]): CatalogExercise => ({
          id,
          name,
          nameEn,
          group: group as MuscleGroup,
          equipmentKey,
          equipment,
          target,
          secondary: (secondary ? secondary.split(",") : []) as MuscleGroup[],
        }),
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const custom = useQuery({
    queryKey: qk.custom,
    queryFn: async () => (await api<{ exercises: CatalogExercise[] }>("/api/custom-exercises")).exercises,
    staleTime: 5 * 60_000,
  });
  const value = useMemo(() => {
    const list = [...(custom.data ?? []), ...(base.data ?? [])];
    const byId = new Map(list.map((e) => [e.id, e]));
    const searchable: Searchable[] = prepare(list);
    return { list, byId, searchable };
  }, [base.data, custom.data]);
  return { ...value, isLoading: base.isLoading };
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
}

export function useApiMutation<TVars, TData>(fn: (v: TVars) => Promise<TData>) {
  return useMutation({ mutationFn: fn });
}

export function gifUrl(id: string) {
  return `https://static.exercisedb.dev/media/${id}.gif`;
}
