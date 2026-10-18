import type { MuscleGroup } from "@/lib/types";

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebraco: "Antebraço",
  abdomen: "Abdômen",
  quadriceps: "Quadríceps",
  posterior: "Posterior",
  gluteos: "Glúteos",
  panturrilha: "Panturrilha",
  adutores: "Adutores",
  lombar: "Lombar",
  trapezio: "Trapézio",
  cardio: "Cardio",
  outros: "Outros",
};

/** Groups shown in filters and the recovery map, in body order. */
export const TRAINABLE_GROUPS: MuscleGroup[] = [
  "peito",
  "costas",
  "ombros",
  "trapezio",
  "biceps",
  "triceps",
  "antebraco",
  "abdomen",
  "lombar",
  "gluteos",
  "quadriceps",
  "posterior",
  "adutores",
  "panturrilha",
];

/** Hours a group usually needs to recover after a moderate session. */
export const BASE_RECOVERY_H: Record<MuscleGroup, number> = {
  peito: 48,
  costas: 48,
  ombros: 40,
  trapezio: 36,
  biceps: 36,
  triceps: 36,
  antebraco: 30,
  abdomen: 30,
  lombar: 48,
  gluteos: 48,
  quadriceps: 56,
  posterior: 52,
  adutores: 40,
  panturrilha: 30,
  cardio: 24,
  outros: 36,
};

export const EQUIPMENT_FILTERS: { key: string; label: string }[] = [
  { key: "barra", label: "Barra" },
  { key: "halteres", label: "Halteres" },
  { key: "maquina", label: "Máquina" },
  { key: "polia", label: "Polia" },
  { key: "corporal", label: "Peso corporal" },
  { key: "elastico", label: "Elástico" },
  { key: "outros", label: "Outros" },
];

export const SET_TYPE_LABEL = {
  warmup: "Aquecimento",
  normal: "Normal",
  drop: "Drop-set",
  failure: "Até a falha",
} as const;

export const SET_TYPE_SHORT = { warmup: "A", normal: "", drop: "D", failure: "F" } as const;

export const CARDIO_KINDS: { key: string; label: string; hasDistance: boolean; hasIncline: boolean }[] = [
  { key: "esteira", label: "Esteira", hasDistance: true, hasIncline: true },
  { key: "corrida", label: "Corrida na rua", hasDistance: true, hasIncline: false },
  { key: "caminhada", label: "Caminhada", hasDistance: true, hasIncline: false },
  { key: "bike", label: "Bicicleta", hasDistance: true, hasIncline: false },
  { key: "eliptico", label: "Elíptico", hasDistance: false, hasIncline: false },
  { key: "escada", label: "Escada", hasDistance: false, hasIncline: false },
  { key: "remo", label: "Remo", hasDistance: true, hasIncline: false },
  { key: "corda", label: "Pular corda", hasDistance: false, hasIncline: false },
  { key: "natacao", label: "Natação", hasDistance: true, hasIncline: false },
  { key: "hiit", label: "HIIT / funcional", hasDistance: false, hasIncline: false },
  { key: "outro", label: "Outro", hasDistance: true, hasIncline: false },
];

export const cardioLabel = (k: string) => CARDIO_KINDS.find((c) => c.key === k)?.label ?? k;
