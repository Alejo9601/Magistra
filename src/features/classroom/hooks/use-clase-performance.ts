import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
   normalizeExamReference,
   normalizeReferenceForKind,
   parseActivityChecklist,
   performanceEntryKey,
} from "@/features/classroom/utils";
import type {
   Assessment,
   ClassSession,
   ClassroomPerformanceEntry,
   ClassroomPerformanceKind,
   Student,
   SubjectActivity,
} from "@/types";

type UseClasePerformanceParams = {
   cls: ClassSession;
   classStudents: Student[];
   subjectActivities: SubjectActivity[];
   subjectAssessments: Assessment[];
   performanceEntries: ClassroomPerformanceEntry[];
   setPerformanceEntries: (classId: string, entries: ClassroomPerformanceEntry[]) => void;
   updateAssessment: (id: string, patch: { gradesLoaded?: number }) => void;
};

export function useClasePerformance({
   cls,
   classStudents,
   subjectActivities,
   subjectAssessments,
   performanceEntries,
   setPerformanceEntries,
   updateAssessment,
}: UseClasePerformanceParams) {
   const [performanceStudentId, setPerformanceStudentId] = useState("");
   const [performanceKind, setPerformanceKind] =
      useState<ClassroomPerformanceKind>("activity");
   const [performanceScore, setPerformanceScore] = useState("");
   const [performanceNote, setPerformanceNote] = useState("");
   const [performanceReferenceLabel, setPerformanceReferenceLabel] = useState("");
   const [editingPerformanceKey, setEditingPerformanceKey] = useState<string | null>(null);

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
         ? cls.evaluativeFormat === "actividad-practica" ||
           cls.evaluativeFormat === "trabajo-practico-evaluativo"
            ? "practice_work"
            : "exam"
         : "activity";

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

   const handleSavePerformance = useCallback(() => {
      const studentId = performanceStudentId;
      const scoreText = performanceScore.trim();
      if (!studentId) {
         toast.error("Selecciona un alumno.");
         return;
      }
      if (!scoreText) {
         toast.error("Ingresa una nota o valor.");
         return;
      }
      if (!performanceReferenceLabel.trim()) {
         toast.error("Selecciona el nombre del examen o actividad.");
         return;
      }

      const numericPattern = /^-?\d+([.,]\d+)?$/;
      const normalizedScore: number | string = numericPattern.test(scoreText)
         ? Number(scoreText.replace(",", "."))
         : scoreText;

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
         note: performanceNote.trim().length > 0 ? performanceNote.trim() : undefined,
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
      setPerformanceEntries,
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
   };
}
