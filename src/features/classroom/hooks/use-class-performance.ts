import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
   normalizeExamReference,
   normalizeReferenceForKind,
   parseActivityChecklist,
   performanceEntryKey,
} from "@/features/classroom/utils";
import {
   mapPercentToScale,
   normalizeSubjectGradingScheme,
   rubricLevelPresets,
} from "@/lib/grading-schemes";
import type {
   Assessment,
   ClassSession,
   ClassroomPerformanceEntry,
   ClassroomPerformanceKind,
   Student,
   Subject,
   SubjectActivity,
} from "@/types";

type UseClassPerformanceParams = {
   cls: ClassSession;
   subject: Subject;
   classStudents: Student[];
   subjectActivities: SubjectActivity[];
   subjectAssessments: Assessment[];
   performanceEntries: ClassroomPerformanceEntry[];
   setPerformanceEntries: (classId: string, entries: ClassroomPerformanceEntry[]) => void;
   updateAssessment: (id: string, patch: { gradesLoaded?: number }) => void;
};

export function useClassPerformance({
   cls,
   subject,
   classStudents,
   subjectActivities,
   subjectAssessments,
   performanceEntries,
   setPerformanceEntries,
   updateAssessment,
}: UseClassPerformanceParams) {
   const [performanceStudentId, setPerformanceStudentId] = useState("");
   const [performanceKind, setPerformanceKind] =
      useState<ClassroomPerformanceKind>("activity");
   const [performanceScore, setPerformanceScore] = useState("");
   const [performanceNote, setPerformanceNote] = useState("");
   const [performanceReferenceLabel, setPerformanceReferenceLabel] = useState("");
   const [editingPerformanceKey, setEditingPerformanceKey] = useState<string | null>(null);
   const [selectedRubricId, setSelectedRubricId] = useState("");
   const [useRubricMode, setUseRubricMode] = useState(false);
   const [rubricCriterionSelections, setRubricCriterionSelections] = useState<
      Record<string, string>
   >({});

   const gradingScheme = useMemo(
      () => normalizeSubjectGradingScheme(subject.gradingScheme),
      [subject.gradingScheme],
   );

   const linkedActivityTitles = useMemo(
      () =>
         subjectActivities
            .filter((activity) => activity.linkedClassIds.includes(cls.id))
            .map((activity) => activity.title),
      [cls.id, subjectActivities],
   );

   const activityChecklist = useMemo(
      () =>
         Array.from(
            new Set([...parseActivityChecklist(cls.activities), ...linkedActivityTitles]),
         ),
      [cls.activities, linkedActivityTitles],
   );

   const linkedAssessmentTitles = useMemo(
      () =>
         subjectAssessments
            .filter((assessment) => assessment.linkedClassId === cls.id)
            .map((assessment) => assessment.title),
      [cls.id, subjectAssessments],
   );

   const examReferenceOptions = useMemo(() => {
      const candidates = [cls.evaluationName?.trim() ?? "", ...linkedAssessmentTitles]
         .map((entry) => normalizeExamReference(entry))
         .filter((entry) => entry.length > 0);

      return candidates.filter((entry, index, arr) => {
         const normalized = entry.toLowerCase();
         return arr.findIndex((item) => item.toLowerCase() === normalized) === index;
      });
   }, [cls.evaluationName, linkedAssessmentTitles]);

   const activityReferenceOptions = useMemo(
      () =>
         Array.from(
            new Set([
               cls.practiceActivityName?.trim() ?? "",
               ...activityChecklist,
               ...subjectActivities.map((activity) => activity.title),
            ]),
         ).filter((entry) => entry.length > 0),
      [activityChecklist, cls.practiceActivityName, subjectActivities],
   );

   const performanceReferenceOptions =
      performanceKind === "exam" ? examReferenceOptions : activityReferenceOptions;

   const displayedReferenceOptions =
      performanceReferenceLabel &&
      !performanceReferenceOptions.includes(performanceReferenceLabel)
         ? [performanceReferenceLabel, ...performanceReferenceOptions]
         : performanceReferenceOptions;

   const defaultPerformanceKind: ClassroomPerformanceKind =
      cls.type === "evaluacion"
         ? cls.evaluativeFormat === "actividad-practica"
            ? "practice_work"
            : "exam"
         : cls.type === "practica" || cls.type === "teorico-practica"
            ? "practice_work"
            : "activity";

   const compatibleRubrics = useMemo(
      () =>
         gradingScheme.rubrics.filter((rubric) => {
            if (cls.type === "evaluacion") {
               if (rubric.targetType !== "evaluacion") {
                  return false;
               }
               return (
                  rubric.evaluativeFormat === "cualquiera" ||
                  rubric.evaluativeFormat === (cls.evaluativeFormat ?? "otro")
               );
            }
            if (cls.type === "practica") {
               return rubric.targetType === "practica";
            }
            if (cls.type === "teorico-practica") {
               return (
                  rubric.targetType === "teorico-practica" || rubric.targetType === "practica"
               );
            }
            return false;
         }),
      [cls.evaluativeFormat, cls.type, gradingScheme.rubrics],
   );

   const availableRubrics = useMemo(
      () =>
         compatibleRubrics.length > 0
            ? compatibleRubrics
            : gradingScheme.rubrics,
      [compatibleRubrics, gradingScheme.rubrics],
   );

   const selectedRubric = useMemo(
      () => availableRubrics.find((rubric) => rubric.id === selectedRubricId) ?? null,
      [availableRubrics, selectedRubricId],
   );

   const rubricComputed = useMemo(() => {
      if (!selectedRubric) {
         return { score: null as number | null, summary: "" };
      }

      const totalWeight = selectedRubric.criteria.reduce(
         (acc, criterion) => acc + criterion.weight,
         0,
      );
      if (totalWeight <= 0) {
         return { score: null as number | null, summary: "" };
      }

      let weightedPercent = 0;
      const summaryParts: string[] = [];
      for (const criterion of selectedRubric.criteria) {
         const levelValue = rubricCriterionSelections[criterion.id];
         if (!levelValue) {
            return { score: null as number | null, summary: "" };
         }
         const level = rubricLevelPresets.find((entry) => entry.value === levelValue);
         if (!level) {
            return { score: null as number | null, summary: "" };
         }
         weightedPercent += (level.scorePercent * criterion.weight) / totalWeight;
         summaryParts.push(`${criterion.name}: ${level.label}`);
      }

      const score = mapPercentToScale(
         weightedPercent,
         gradingScheme.scale,
         gradingScheme.rounding,
      );

      return {
         score,
         summary: `${selectedRubric.name}: ${summaryParts.join(" | ")}`,
      };
   }, [gradingScheme.rounding, gradingScheme.scale, rubricCriterionSelections, selectedRubric]);

   useEffect(() => {
      if (!performanceStudentId && classStudents.length > 0) {
         setPerformanceStudentId(classStudents[0].id);
      }
   }, [classStudents, performanceStudentId]);

   useEffect(() => {
      if (!editingPerformanceKey && performanceKind !== defaultPerformanceKind) {
         setPerformanceKind(defaultPerformanceKind);
      }
      if (performanceReferenceOptions.length === 0) {
         setPerformanceReferenceLabel("");
         return;
      }
      if (!performanceReferenceOptions.includes(performanceReferenceLabel)) {
         setPerformanceReferenceLabel(performanceReferenceOptions[0]);
      }
   }, [
      defaultPerformanceKind,
      editingPerformanceKey,
      performanceKind,
      performanceReferenceLabel,
      performanceReferenceOptions,
   ]);

   useEffect(() => {
      if (availableRubrics.length === 0) {
         setSelectedRubricId("");
         setRubricCriterionSelections({});
         setUseRubricMode(false);
         return;
      }
      setUseRubricMode((prev) => prev || availableRubrics.length > 0);
      if (!availableRubrics.some((rubric) => rubric.id === selectedRubricId)) {
         setSelectedRubricId(availableRubrics[0].id);
      }
   }, [availableRubrics, selectedRubricId]);

   useEffect(() => {
      if (!selectedRubric) {
         setRubricCriterionSelections({});
         return;
      }
      setRubricCriterionSelections((prev) => {
         const next: Record<string, string> = {};
         for (const criterion of selectedRubric.criteria) {
            next[criterion.id] = prev[criterion.id] ?? "";
         }
         return next;
      });
   }, [selectedRubric]);

   const syncAssessmentGradesLoaded = useCallback(
      (
         entries: ClassroomPerformanceEntry[],
         kind: ClassroomPerformanceKind,
         referenceLabel?: string,
      ) => {
         const assessmentType =
            kind === "practice_work" ? "practice_work" : kind === "exam" ? "exam" : null;
         if (!assessmentType) {
            return;
         }

         const linkedAssessments = subjectAssessments.filter(
            (assessment) =>
               assessment.linkedClassId === cls.id && assessment.type === assessmentType,
         );
         if (linkedAssessments.length === 0) {
            return;
         }

         const normalizedReference = referenceLabel
            ? normalizeReferenceForKind(referenceLabel, kind)
            : "";
         const targetAssessment =
            linkedAssessments.find((assessment) => {
               const title = normalizeReferenceForKind(assessment.title, kind);
               return (
                  normalizedReference.length > 0 &&
                  (normalizedReference === title ||
                     normalizedReference.includes(title) ||
                     title.includes(normalizedReference))
               );
            }) ?? linkedAssessments[0];

         const normalizedAssessmentTitle = normalizeReferenceForKind(
            targetAssessment.title,
            kind,
         );

         const filteredEntries = entries
            .filter((entry) => entry.kind === kind)
            .filter((entry) => {
               if (linkedAssessments.length === 1) {
                  return true;
               }
               const entryReference = entry.referenceLabel
                  ? normalizeReferenceForKind(entry.referenceLabel, kind)
                  : "";
               if (!entryReference) {
                  return true;
               }
               return (
                  entryReference === normalizedAssessmentTitle ||
                  entryReference.includes(normalizedAssessmentTitle) ||
                  normalizedAssessmentTitle.includes(entryReference)
               );
            });

         const uniqueStudents = new Set(filteredEntries.map((entry) => entry.studentId));
         updateAssessment(targetAssessment.id, {
            gradesLoaded: uniqueStudents.size,
         });
      },
      [cls.id, subjectAssessments, updateAssessment],
   );

   const resetPerformanceForm = useCallback(() => {
      setPerformanceKind(defaultPerformanceKind);
      setPerformanceScore("");
      setPerformanceNote("");
      const defaultReferenceOptions =
         defaultPerformanceKind === "exam"
            ? examReferenceOptions
            : activityReferenceOptions;
      setPerformanceReferenceLabel(defaultReferenceOptions[0] ?? "");
      setEditingPerformanceKey(null);
   }, [activityReferenceOptions, defaultPerformanceKind, examReferenceOptions]);

   const applyRubricScore = useCallback(() => {
      if (rubricComputed.score === null || !selectedRubric) {
         toast.error("Completa los niveles de todos los criterios de la rúbrica.");
         return;
      }
      setPerformanceScore(String(rubricComputed.score));
      setPerformanceNote((prev) => {
         if (!prev.trim()) {
            return rubricComputed.summary;
         }
         return prev;
      });
      toast.success("Nota calculada desde la rúbrica.");
   }, [rubricComputed.score, rubricComputed.summary, selectedRubric]);

   const handleSavePerformance = useCallback(() => {
      const studentId = performanceStudentId;
      const scoreText = performanceScore.trim();
      if (!studentId) {
         toast.error("Selecciona un alumno.");
         return;
      }

      const resolvedScoreText = useRubricMode
         ? scoreText || (rubricComputed.score !== null ? String(rubricComputed.score) : "")
         : scoreText;
      if (!resolvedScoreText) {
         toast.error("Ingresa una nota o valor.");
         return;
      }
      if (!performanceReferenceLabel.trim()) {
         toast.error("Selecciona el nombre del examen o actividad.");
         return;
      }

      const numericPattern = /^-?\d+([.,]\d+)?$/;
      const normalizedScore: number | string = numericPattern.test(resolvedScoreText)
         ? Number(resolvedScoreText.replace(",", "."))
         : resolvedScoreText;

      const resolvedNote = performanceNote.trim().length > 0
         ? performanceNote.trim()
         : useRubricMode
            ? rubricComputed.summary || undefined
            : undefined;

      const nextEntry: ClassroomPerformanceEntry = {
         studentId,
         kind: performanceKind,
         score: normalizedScore,
         referenceLabel:
            performanceReferenceLabel.trim().length > 0
               ? performanceKind === "exam"
                  ? normalizeExamReference(performanceReferenceLabel)
                  : performanceReferenceLabel.trim()
               : undefined,
         note: resolvedNote,
      };

      const nextEntries = [
         ...performanceEntries.filter(
            (entry) => performanceEntryKey(entry) !== performanceEntryKey(nextEntry),
         ),
         nextEntry,
      ];

      setPerformanceEntries(cls.id, nextEntries);
      syncAssessmentGradesLoaded(nextEntries, performanceKind, nextEntry.referenceLabel);
      toast.success(editingPerformanceKey ? "Registro actualizado." : "Registro agregado.");
      resetPerformanceForm();
   }, [
      cls.id,
      editingPerformanceKey,
      performanceEntries,
      performanceKind,
      performanceNote,
      performanceReferenceLabel,
      performanceScore,
      performanceStudentId,
      resetPerformanceForm,
      rubricComputed.score,
      rubricComputed.summary,
      setPerformanceEntries,
      useRubricMode,
      syncAssessmentGradesLoaded,
   ]);

   const handleEditPerformance = useCallback((entry: ClassroomPerformanceEntry) => {
      setPerformanceStudentId(entry.studentId);
      setPerformanceKind(entry.kind);
      setPerformanceScore(String(entry.score));
      setPerformanceNote(entry.note ?? "");
      setPerformanceReferenceLabel(entry.referenceLabel ?? "");
      setEditingPerformanceKey(performanceEntryKey(entry));
   }, []);

   const handleDeletePerformance = useCallback(
      (entry: ClassroomPerformanceEntry) => {
         const nextEntries = performanceEntries.filter(
            (current) => performanceEntryKey(current) !== performanceEntryKey(entry),
         );
         setPerformanceEntries(cls.id, nextEntries);
         syncAssessmentGradesLoaded(nextEntries, entry.kind, entry.referenceLabel);
         if (editingPerformanceKey === performanceEntryKey(entry)) {
            resetPerformanceForm();
         }
         toast.success("Registro eliminado.");
      },
      [
         cls.id,
         editingPerformanceKey,
         performanceEntries,
         resetPerformanceForm,
         setPerformanceEntries,
         syncAssessmentGradesLoaded,
      ],
   );

   const studentNameById = useCallback(
      (studentId: string) => {
         const student = classStudents.find((item) => item.id === studentId);
         if (!student) {
            return "Alumno no encontrado";
         }
         return `${student.lastName}, ${student.name}`;
      },
      [classStudents],
   );

   return {
      performanceStudentId,
      performanceReferenceLabel,
      displayedReferenceOptions,
      performanceScore,
      performanceNote,
      editingPerformanceKey,
      setPerformanceStudentId,
      setPerformanceReferenceLabel,
      setPerformanceScore,
      setPerformanceNote,
      resetPerformanceForm,
      handleSavePerformance,
      handleEditPerformance,
      handleDeletePerformance,
      studentNameById,
      availableRubrics,
      useRubricMode,
      setUseRubricMode,
      selectedRubricId,
      rubricCriterionSelections,
      rubricComputedScore: rubricComputed.score,
      setSelectedRubricId,
      setRubricCriterionSelection: (criterionId: string, value: string) =>
         setRubricCriterionSelections((prev) => ({ ...prev, [criterionId]: value })),
      applyRubricScore,
   };
}









