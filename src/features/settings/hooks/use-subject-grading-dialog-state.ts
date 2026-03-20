import { useEffect, useMemo, useState } from "react";
import {
   createDefaultRubricCriterion,
   createDefaultSubjectGradingScheme,
   createDefaultSubjectRubric,
   normalizeSubjectGradingScheme,
} from "@/lib/grading-schemes";
import type { Subject, SubjectGradingScheme, SubjectRubric } from "@/types";
import { normalizeRubric, toNumber, type WeightKey } from "@/features/settings/utils/subject-grading-dialog.utils";

type UseSubjectGradingDialogStateProps = {
   open: boolean;
   subject: Subject | null;
   onOpenChange: (open: boolean) => void;
   onSave: (subjectId: string, gradingScheme: SubjectGradingScheme) => void;
};

export function useSubjectGradingDialogState({
   open,
   subject,
   onOpenChange,
   onSave,
}: UseSubjectGradingDialogStateProps) {
   const [draft, setDraft] = useState<SubjectGradingScheme>(
      createDefaultSubjectGradingScheme(),
   );

   useEffect(() => {
      if (!open) {
         return;
      }
      setDraft(normalizeSubjectGradingScheme(subject?.gradingScheme));
   }, [open, subject]);

   const totalWeight = useMemo(
      () =>
         draft.weights.exams +
         draft.weights.practice +
         draft.weights.activities +
         draft.weights.participation,
      [draft.weights],
   );

   const updateRubric = (rubricId: string, patch: Partial<SubjectRubric>) => {
      setDraft((prev) => ({
         ...prev,
         rubrics: prev.rubrics.map((rubric) =>
            rubric.id === rubricId ? { ...rubric, ...patch } : rubric,
         ),
      }));
   };

   const setScale = (value: SubjectGradingScheme["scale"]) => {
      setDraft((prev) => ({
         ...prev,
         scale: value,
         passingScore: value === "numeric-100" ? 60 : 6,
      }));
   };

   const setPassingScore = (rawValue: string) => {
      setDraft((prev) => ({
         ...prev,
         passingScore: toNumber(rawValue),
      }));
   };

   const setRounding = (value: SubjectGradingScheme["rounding"]) => {
      setDraft((prev) => ({
         ...prev,
         rounding: value,
      }));
   };

   const updateWeight = (key: WeightKey, rawValue: string) => {
      setDraft((prev) => ({
         ...prev,
         weights: {
            ...prev.weights,
            [key]: toNumber(rawValue),
         },
      }));
   };

   const addRubric = () => {
      setDraft((prev) => ({
         ...prev,
         rubrics: [
            ...prev.rubrics,
            createDefaultSubjectRubric({
               name: `Rúbrica ${prev.rubrics.length + 1}`,
            }),
         ],
      }));
   };

   const removeRubric = (rubricId: string) => {
      setDraft((prev) => ({
         ...prev,
         rubrics: prev.rubrics.filter((rubric) => rubric.id !== rubricId),
      }));
   };

   const addCriterion = (rubric: SubjectRubric) => {
      updateRubric(rubric.id, {
         criteria: [
            ...rubric.criteria,
            createDefaultRubricCriterion({
               name: `Criterio ${rubric.criteria.length + 1}`,
               weight: 20,
            }),
         ],
      });
   };

   const updateCriterion = (
      rubric: SubjectRubric,
      criterionId: string,
      patch: Partial<SubjectRubric["criteria"][number]>,
   ) => {
      updateRubric(rubric.id, {
         criteria: rubric.criteria.map((item) =>
            item.id === criterionId ? { ...item, ...patch } : item,
         ),
      });
   };

   const removeCriterion = (rubric: SubjectRubric, criterionId: string) => {
      updateRubric(rubric.id, {
         criteria: rubric.criteria.filter((item) => item.id !== criterionId),
      });
   };

   const handleSave = () => {
      if (!subject || totalWeight !== 100) {
         return;
      }

      const normalized = normalizeSubjectGradingScheme({
         ...draft,
         rubrics: draft.rubrics.map((rubric) => normalizeRubric(rubric)),
      });

      onSave(subject.id, normalized);
      onOpenChange(false);
   };

   return {
      draft,
      totalWeight,
      setScale,
      setPassingScore,
      setRounding,
      updateWeight,
      addRubric,
      removeRubric,
      addCriterion,
      updateRubric,
      updateCriterion,
      removeCriterion,
      handleSave,
   };
}
