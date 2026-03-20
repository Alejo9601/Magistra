import { createDefaultRubricCriterion } from "@/lib/grading-schemes";
import type { SubjectGradingScheme, SubjectRubric } from "@/types";

export type WeightKey = keyof SubjectGradingScheme["weights"];

export const WEIGHT_FIELDS: Array<{ key: WeightKey; label: string }> = [
   { key: "exams", label: "Exámenes" },
   { key: "practice", label: "Prácticos" },
   { key: "activities", label: "Actividades" },
   { key: "participation", label: "Participación" },
];

export function toNumber(value: string): number {
   return Number(value || 0);
}

export function normalizeRubric(rubric: SubjectRubric): SubjectRubric {
   const criteriaTotal = rubric.criteria.reduce((acc, item) => acc + item.weight, 0);
   const normalizedCriteria =
      criteriaTotal > 0
         ? rubric.criteria
         : [createDefaultRubricCriterion({ name: "Criterio", weight: 100 })];

   return {
      ...rubric,
      name: rubric.name.trim() || "Rúbrica",
      criteria: normalizedCriteria.map((criterion) => ({
         ...criterion,
         name: criterion.name.trim() || "Criterio",
         weight: Math.max(1, Math.round(criterion.weight || 0)),
      })),
   };
}
