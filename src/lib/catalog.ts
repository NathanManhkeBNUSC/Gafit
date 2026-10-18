import "server-only";
import { and, eq } from "drizzle-orm";
import raw from "@/data/exercises.json";
import { getDb, schema } from "@/lib/db";
import { prepare, searchExercises, type Searchable } from "@/lib/search";
import type { CatalogExercise, MuscleGroup } from "@/lib/types";

export interface CatalogRecord {
  id: string;
  name: string;
  nameEn: string;
  gif: string;
  group: MuscleGroup;
  secondaryGroups: MuscleGroup[];
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  equipmentKey: string;
  isCardio: boolean;
  instructionsEn: string[];
  hidden: boolean;
}

const records = raw as CatalogRecord[];
const byId = new Map(records.map((r) => [r.id, r]));

export function catalogRecord(id: string): CatalogRecord | undefined {
  return byId.get(id);
}

export function toCatalogExercise(r: CatalogRecord): CatalogExercise {
  return {
    id: r.id,
    name: r.name,
    nameEn: r.nameEn,
    group: r.group,
    equipmentKey: r.equipmentKey,
    equipment: r.equipment,
    target: r.target,
    secondary: r.secondaryGroups,
  };
}

let searchable: Searchable[] | null = null;
export function catalogSearch(query: string, limit = 8): CatalogExercise[] {
  if (!searchable) searchable = prepare(records.filter((r) => !r.isCardio && !r.hidden).map(toCatalogExercise));
  return searchExercises(searchable, query, limit);
}

export async function userCustomExercises(userId: string): Promise<CatalogExercise[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.customExercises).where(eq(schema.customExercises.userId, userId));
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    nameEn: "",
    group: c.group as MuscleGroup,
    equipmentKey: "outros",
    equipment: c.equipment ?? "",
    target: "",
    secondary: [],
    custom: true,
    videoUrl: c.videoUrl,
  }));
}

/** Muscle groups for an exercise id (catalog or the user's custom exercise). */
export async function groupResolver(userId: string) {
  const customs = await userCustomExercises(userId);
  const customMap = new Map(customs.map((c) => [c.id, c]));
  return (id: string): { group: MuscleGroup; secondary: MuscleGroup[] } => {
    const r = byId.get(id);
    if (r) return { group: r.group, secondary: r.secondaryGroups };
    const c = customMap.get(id);
    return { group: c?.group ?? "outros", secondary: [] };
  };
}

export async function getCustomExercise(userId: string, id: string) {
  const db = await getDb();
  const [c] = await db
    .select()
    .from(schema.customExercises)
    .where(and(eq(schema.customExercises.userId, userId), eq(schema.customExercises.id, id)))
    .limit(1);
  return c ?? null;
}

export function allCatalogIds() {
  return byId;
}
