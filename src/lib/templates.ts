import type { PlanDay } from "@/lib/types";

type T = [exerciseId: string, sets: number, reps: string, restSec: number];
interface Template {
  key: string;
  name: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  daysPerWeek: number;
  description: string;
  days: { name: string; focus: string; exercises: T[] }[];
}

export const TEMPLATES: Template[] = [
  {
    key: "fullbody-iniciante",
    name: "Full body iniciante",
    level: "Iniciante",
    daysPerWeek: 3,
    description: "Corpo todo em dois treinos alternados, só com máquinas e halteres. Bom para aprender os movimentos.",
    days: [
      {
        name: "Treino A",
        focus: "Corpo todo",
        exercises: [
          ["10Z2DXU", 3, "12", 90],
          ["DOoWcnA", 3, "12", 90],
          ["7F1DVzn", 3, "12", 90],
          ["CggQhII", 3, "12", 75],
          ["17lJ1kr", 3, "12", 75],
          ["TFqbd8t", 3, "15", 60],
        ],
      },
      {
        name: "Treino B",
        focus: "Corpo todo",
        exercises: [
          ["yn8yg1r", 3, "12", 90],
          ["B3Rxp6L", 3, "12", 90],
          ["7I6LNUG", 3, "12", 90],
          ["my33uHU", 3, "12", 75],
          ["DsgkuIt", 3, "15", 60],
          ["RKjH6Lt", 3, "30s", 45],
        ],
      },
    ],
  },
  {
    key: "abc-hipertrofia",
    name: "ABC hipertrofia",
    level: "Intermediário",
    daysPerWeek: 3,
    description: "A divisão clássica: empurrar, puxar e pernas. Rode A, B, C e recomece.",
    days: [
      {
        name: "Treino A",
        focus: "Peito, ombros e tríceps",
        exercises: [
          ["EIeI8Vf", 4, "8-10", 120],
          ["B3Rxp6L", 3, "10-12", 90],
          ["0CXGHya", 3, "12-15", 60],
          ["znQUdHY", 3, "10-12", 90],
          ["DsgkuIt", 4, "12-15", 60],
          ["dU605di", 3, "12", 60],
          ["kont8Ut", 3, "12", 60],
        ],
      },
      {
        name: "Treino B",
        focus: "Costas e bíceps",
        exercises: [
          ["RVwzP10", 4, "10-12", 90],
          ["eZyBC3j", 4, "8-10", 120],
          ["hvV79Si", 3, "10-12", 90],
          ["x69MAlq", 3, "12-15", 60],
          ["wqNPGCg", 3, "15", 60],
          ["25GPyDY", 3, "10", 60],
          ["2NpxjC1", 3, "12", 60],
        ],
      },
      {
        name: "Treino C",
        focus: "Pernas e abdômen",
        exercises: [
          ["iYzB0Cz", 4, "8-10", 150],
          ["10Z2DXU", 4, "10-12", 120],
          ["my33uHU", 3, "12-15", 60],
          ["17lJ1kr", 3, "10-12", 75],
          ["hrVQWvE", 3, "10", 90],
          ["ykUOVze", 4, "15", 45],
          ["I3tsCnC", 3, "12", 60],
        ],
      },
    ],
  },
  {
    key: "inferiores-gluteos",
    name: "Inferiores com foco em glúteos",
    level: "Intermediário",
    daysPerWeek: 4,
    description: "Duas pernas por semana com ênfase em glúteos, intercaladas com superiores.",
    days: [
      {
        name: "Treino A",
        focus: "Glúteos e posterior",
        exercises: [
          ["qg2PGl6", 4, "8-12", 120],
          ["hrVQWvE", 4, "10", 90],
          ["qx4fgX7", 3, "10 cada perna", 90],
          ["Zg3XY7P", 3, "12", 60],
          ["CHpahtl", 4, "15-20", 45],
        ],
      },
      {
        name: "Treino B",
        focus: "Superiores",
        exercises: [
          ["RVwzP10", 3, "10-12", 90],
          ["DOoWcnA", 3, "10-12", 90],
          ["7I6LNUG", 3, "12", 75],
          ["DsgkuIt", 3, "15", 60],
          ["BU15nH4", 3, "12", 60],
          ["3ZflifB", 3, "12", 60],
        ],
      },
      {
        name: "Treino C",
        focus: "Quadríceps e glúteos",
        exercises: [
          ["iYzB0Cz", 4, "8-10", 150],
          ["10Z2DXU", 4, "12", 120],
          ["RRWFUcw", 3, "12 cada perna", 90],
          ["my33uHU", 3, "15", 60],
          ["oHsrypV", 3, "15", 45],
          ["bOOdeyc", 4, "15", 45],
        ],
      },
      {
        name: "Treino D",
        focus: "Ombros, braços e core",
        exercises: [
          ["znQUdHY", 3, "10-12", 90],
          ["3eGE2JC", 3, "12", 60],
          ["v1qBec9", 3, "15", 60],
          ["2NpxjC1", 3, "12", 60],
          ["dU605di", 3, "12", 60],
          ["nCU1Ekp", 3, "15", 45],
        ],
      },
    ],
  },
  {
    key: "ppl-6x",
    name: "Push / Pull / Legs",
    level: "Avançado",
    daysPerWeek: 6,
    description: "Empurrar, puxar e pernas duas vezes por semana. Volume alto para quem já tem base.",
    days: [
      {
        name: "Push",
        focus: "Peito, ombros e tríceps",
        exercises: [
          ["EIeI8Vf", 4, "6-8", 150],
          ["B3Rxp6L", 3, "8-10", 120],
          ["v3xmPAR", 3, "12-15", 60],
          ["znQUdHY", 3, "8-10", 120],
          ["DsgkuIt", 4, "15", 45],
          ["EMpUwRI", 3, "10", 75],
          ["dU605di", 3, "12-15", 60],
        ],
      },
      {
        name: "Pull",
        focus: "Costas, trapézio e bíceps",
        exercises: [
          ["ila4NZS", 3, "5", 180],
          ["lBDjFxJ", 4, "até a falha", 120],
          ["eZyBC3j", 3, "8-10", 120],
          ["v2DfH14", 3, "10-12", 75],
          ["wqNPGCg", 3, "15", 60],
          ["NJzBsGJ", 3, "12", 60],
          ["qOgPVf6", 3, "10", 60],
        ],
      },
      {
        name: "Legs",
        focus: "Pernas e panturrilha",
        exercises: [
          ["iYzB0Cz", 4, "6-8", 180],
          ["Qa55kX1", 3, "10", 120],
          ["hrVQWvE", 3, "8-10", 120],
          ["my33uHU", 3, "12-15", 60],
          ["17lJ1kr", 3, "10-12", 75],
          ["ykUOVze", 4, "12-15", 45],
        ],
      },
    ],
  },
];

export function templateDays(t: Template, makeId: () => string): PlanDay[] {
  return t.days.map((d) => ({
    id: makeId(),
    name: d.name,
    focus: d.focus,
    exercises: d.exercises.map(([exerciseId, sets, reps, restSec]) => ({
      id: makeId(),
      exerciseId,
      sets,
      reps,
      restSec,
    })),
  }));
}
