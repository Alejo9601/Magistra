import type {
   GradeRounding,
   GradeScale,
   SubjectGradingScheme,
   SubjectRubric,
   SubjectRubricCriterion,
   SubjectRubricEvaluativeFormat,
   SubjectRubricTargetType,
} from "@/types";

export type RubricLevelPreset = {
   value: string;
   label: string;
   scorePercent: number;
};

export const rubricLevelPresets: RubricLevelPreset[] = [
   { value: "excelente", label: "Excelente", scorePercent: 100 },
   { value: "muy-bueno", label: "Muy bueno", scorePercent: 85 },
   { value: "bueno", label: "Bueno", scorePercent: 70 },
   { value: "en-proceso", label: "En proceso", scorePercent: 55 },
   { value: "inicial", label: "Inicial", scorePercent: 40 },
];

export function createDefaultRubricCriterion(overrides?: Partial<SubjectRubricCriterion>): SubjectRubricCriterion {
   return {
      id: `crit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: "Nuevo criterio",
      weight: 100,
      ...overrides,
   };
}

export function createDefaultSubjectRubric(overrides?: Partial<SubjectRubric>): SubjectRubric {
   return {
      id: `rub-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: "Rúbrica general",
      targetType: "evaluacion",
      evaluativeFormat: "cualquiera",
      criteria: [
         createDefaultRubricCriterion({ name: "Comprensión", weight: 50 }),
         createDefaultRubricCriterion({ name: "Aplicación", weight: 50 }),
      ],
      ...overrides,
   };
}

export function createDefaultSubjectGradingScheme(
   overrides?: Partial<SubjectGradingScheme>,
): SubjectGradingScheme {
   const scale = overrides?.scale ?? "numeric-10";
   return {
      scale,
      passingScore: scale === "numeric-100" ? 60 : 6,
      rounding: "nearest",
      weights: {
         exams: 40,
         practice: 30,
         activities: 20,
         participation: 10,
      },
      rubrics: [],
      ...overrides,
   };
}

function normalizeScale(value: unknown): GradeScale {
   return value === "numeric-100" ? "numeric-100" : "numeric-10";
}

function normalizeRounding(value: unknown): GradeRounding {
   if (value === "none" || value === "up" || value === "nearest") {
      return value;
   }
   return "nearest";
}

function normalizeTargetType(value: unknown): SubjectRubricTargetType {
   if (value === "practica" || value === "teorico-practica") {
      return value;
   }
   return "evaluacion";
}

function normalizeEvaluativeFormat(value: unknown): SubjectRubricEvaluativeFormat {
   if (
      value === "oral" ||
      value === "escrito" ||
      value === "actividad-practica" ||
      value === "otro" ||
      value === "cualquiera"
   ) {
      return value;
   }
   return "cualquiera";
}

function normalizeRubricCriteria(raw: unknown): SubjectRubricCriterion[] {
   if (!Array.isArray(raw)) {
      return [];
   }

   const criteria = raw
      .map((item) => {
         if (!item || typeof item !== "object") {
            return null;
         }
         const input = item as Partial<SubjectRubricCriterion>;
         if (typeof input.id !== "string" || typeof input.name !== "string") {
            return null;
         }
         const nextWeight =
            typeof input.weight === "number" && Number.isFinite(input.weight) && input.weight > 0
               ? Math.max(1, Math.round(input.weight))
               : 0;
         return {
            id: input.id,
            name: input.name.trim(),
            weight: nextWeight,
         };
      })
      .filter((item): item is SubjectRubricCriterion => item !== null && item.name.length > 0);

   const total = criteria.reduce((acc, item) => acc + item.weight, 0);
   if (criteria.length === 0 || total <= 0) {
      return [];
   }

   return criteria;
}

function normalizeRubrics(raw: unknown): SubjectRubric[] {
   if (!Array.isArray(raw)) {
      return [];
   }

   return raw
      .map((item) => {
         if (!item || typeof item !== "object") {
            return null;
         }
         const input = item as Partial<SubjectRubric>;
         if (typeof input.id !== "string" || typeof input.name !== "string") {
            return null;
         }
         const normalizedCriteria = normalizeRubricCriteria(input.criteria);
         if (normalizedCriteria.length === 0) {
            return null;
         }
         return {
            id: input.id,
            name: input.name.trim(),
            targetType: normalizeTargetType(input.targetType),
            evaluativeFormat: normalizeEvaluativeFormat(input.evaluativeFormat),
            criteria: normalizedCriteria,
         };
      })
      .filter((item): item is SubjectRubric => item !== null && item.name.length > 0);
}

export function normalizeSubjectGradingScheme(raw: unknown): SubjectGradingScheme {
   if (!raw || typeof raw !== "object") {
      return createDefaultSubjectGradingScheme();
   }

   const input = raw as Partial<SubjectGradingScheme>;
   const scale = normalizeScale(input.scale);
   const defaultPassing = scale === "numeric-100" ? 60 : 6;
   const rawPassing =
      typeof input.passingScore === "number" && Number.isFinite(input.passingScore)
         ? input.passingScore
         : defaultPassing;

   const passingScore =
      scale === "numeric-100"
         ? Math.min(100, Math.max(1, rawPassing))
         : Math.min(10, Math.max(1, rawPassing));

   const rawWeights = input.weights;
   const exams = typeof rawWeights?.exams === "number" ? Math.max(0, rawWeights.exams) : 40;
   const practice = typeof rawWeights?.practice === "number" ? Math.max(0, rawWeights.practice) : 30;
   const activities =
      typeof rawWeights?.activities === "number" ? Math.max(0, rawWeights.activities) : 20;
   const participation =
      typeof rawWeights?.participation === "number"
         ? Math.max(0, rawWeights.participation)
         : 10;

   return {
      scale,
      passingScore,
      rounding: normalizeRounding(input.rounding),
      weights: {
         exams,
         practice,
         activities,
         participation,
      },
      rubrics: normalizeRubrics(input.rubrics),
   };
}

export function roundByMode(score: number, mode: GradeRounding) {
   if (mode === "none") {
      return score;
   }
   if (mode === "up") {
      return Math.ceil(score * 10) / 10;
   }
   return Math.round(score * 10) / 10;
}

export function mapPercentToScale(percent: number, scale: GradeScale, rounding: GradeRounding) {
   const boundedPercent = Math.max(0, Math.min(100, percent));
   const baseScore = scale === "numeric-100" ? boundedPercent : boundedPercent / 10;
   return roundByMode(baseScore, rounding);
}
