import { mapPercentToScale } from "@/lib/grading-schemes";
import type { ActivityStudentGrade, GradeScale, GradeRounding, SubjectRubric } from "@/types";

export function gradingScaleMax(scale: GradeScale) {
   return scale === "numeric-100" ? 100 : 10;
}

export function clampScore(value: number, scale: GradeScale) {
   const max = gradingScaleMax(scale);
   return Math.max(0, Math.min(max, value));
}

export function scoreToPercent(score: number, scale: GradeScale) {
   const bounded = clampScore(score, scale);
   return scale === "numeric-100" ? bounded : bounded * 10;
}

export function computeRubricScore(params: {
   rubric: SubjectRubric;
   criteriaScores: Record<string, number>;
   scale: GradeScale;
   rounding: GradeRounding;
}) {
   const { rubric, criteriaScores, scale, rounding } = params;
   const totalWeight = rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
   if (totalWeight <= 0) {
      return null;
   }

   const hasAllCriteria = rubric.criteria.every(
      (criterion) => typeof criteriaScores[criterion.id] === "number",
   );

   const weightedPercent = rubric.criteria.reduce((sum, criterion) => {
      const score = criteriaScores[criterion.id];
      if (typeof score !== "number") {
         return sum;
      }
      return sum + scoreToPercent(score, scale) * (criterion.weight / totalWeight);
   }, 0);

   return {
      hasAllCriteria,
      score: mapPercentToScale(weightedPercent, scale, rounding),
   };
}

export function scoreDescriptor(score: number, scale: GradeScale) {
   const percent = scoreToPercent(score, scale);
   if (percent >= 90) return "Dominio solido con muy pocos errores.";
   if (percent >= 80) return "Comprende correctamente con pequenos ajustes.";
   if (percent >= 70) return "Desempeno adecuado, con margen de mejora.";
   if (percent >= 60) return "Nivel basico, requiere refuerzo.";
   return "Desempeno inicial, necesita acompanamiento.";
}

export function upsertStudentGrade(
   grades: ActivityStudentGrade[],
   nextGrade: ActivityStudentGrade,
) {
   const index = grades.findIndex((grade) => grade.studentId === nextGrade.studentId);
   if (index < 0) {
      return [...grades, nextGrade];
   }
   return grades.map((grade, gradeIndex) => (gradeIndex === index ? nextGrade : grade));
}
