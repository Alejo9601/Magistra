import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
   getAssignmentIdBySubjectId,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useActivitiesContext } from "@/features/activities";
import { useAssessmentsContext } from "@/features/assessments";
import { AttendanceCard } from "@/features/classroom/attendance-card";
import { classTypeLabels } from "@/features/classroom/constants";
import { ClaseDictadoHeader } from "@/features/classroom/components/clase-dictado-header";
import { ClaseDictadoSummaryCard } from "@/features/classroom/components/clase-dictado-summary-card";
import { ClaseDictadoSubtopicsCard } from "@/features/classroom/components/clase-dictado-subtopics-card";
import { ClaseDictadoGradesCard } from "@/features/classroom/components/clase-dictado-grades-card";
import {
   evaluativeFormatLabelMap,
   normalizeExamReference,
   normalizeReferenceForKind,
   parseActivityChecklist,
   performanceEntryKey,
} from "@/features/classroom/utils";
import type { AttendanceStatus } from "@/features/classroom/types";
import type { ClassroomPerformanceEntry, ClassroomPerformanceKind } from "@/types";


export function ClaseDictadoContent() {
   const params = useParams();
   const navigate = useNavigate();
   const classId = params.id as string;
   const { classes, markClassAsTaught, updateClass } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const {
      getRecord,
      toggleSubtopic,
      setAttendance,
      setNotes,
      setPerformanceEntries,
   } = useClassroomContext();
   const { getActivitiesByAssignment } = useActivitiesContext();
   const { getAssessmentsByAssignment, updateAssessment } = useAssessmentsContext();

   const [addingSubtopic, setAddingSubtopic] = useState(false);
   const [newSubtopic, setNewSubtopic] = useState("");
   const [performanceStudentId, setPerformanceStudentId] = useState("");
   const [performanceKind, setPerformanceKind] =
      useState<ClassroomPerformanceKind>("activity");
   const [performanceScore, setPerformanceScore] = useState("");
   const [performanceNote, setPerformanceNote] = useState("");
   const [performanceReferenceLabel, setPerformanceReferenceLabel] = useState("");
   const [editingPerformanceKey, setEditingPerformanceKey] = useState<string | null>(null);

   const cls = classes.find((classSession) => classSession.id === classId);
   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const institution = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];
   const subjectActivities = assignmentId ? getActivitiesByAssignment(assignmentId) : [];
   const linkedActivityTitles = cls
      ? subjectActivities
           .filter((activity) => activity.linkedClassIds.includes(cls.id))
           .map((activity) => activity.title)
      : [];
   const activityChecklist = cls
      ? Array.from(
           new Set([...parseActivityChecklist(cls.activities), ...linkedActivityTitles]),
        )
      : [];
   const subjectAssessments = assignmentId ? getAssessmentsByAssignment(assignmentId) : [];
   const linkedAssessmentTitles = cls
      ? subjectAssessments
           .filter((assessment) => assessment.linkedClassId === cls.id)
           .map((assessment) => assessment.title)
      : [];
   const examReferenceCandidates = [
      cls?.evaluationName?.trim() ?? "",
      ...linkedAssessmentTitles,
   ]
      .map((entry) => normalizeExamReference(entry))
      .filter((entry) => entry.length > 0);
   const examReferenceOptions = examReferenceCandidates.filter((entry, index, arr) => {
      const normalized = entry.toLowerCase();
      return arr.findIndex((item) => item.toLowerCase() === normalized) === index;
   });
   const activityReferenceOptions = Array.from(
      new Set([
         cls?.practiceActivityName?.trim() ?? "",
         ...activityChecklist,
         ...subjectActivities.map((activity) => activity.title),
      ]),
   ).filter((entry) => entry.length > 0);
   const performanceReferenceOptions =
      performanceKind === "exam" ? examReferenceOptions : activityReferenceOptions;
   const displayedReferenceOptions =
      performanceReferenceLabel &&
      !performanceReferenceOptions.includes(performanceReferenceLabel)
         ? [performanceReferenceLabel, ...performanceReferenceOptions]
         : performanceReferenceOptions;

   const defaultPerformanceKind: ClassroomPerformanceKind =
      cls?.type === "evaluacion"
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

   if (!cls || !subject || !institution) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const record = getRecord(cls.id);
   const performanceEntries = record.performanceEntries;
   const attendanceWithDefaults: Record<string, AttendanceStatus> = Object.fromEntries(
      classStudents.map((student) => [
         student.id,
         record.attendance[student.id] ?? ("P" as AttendanceStatus),
      ]),
   );
   const isFinalized = cls.status === "finalizada";
   const showGradesSection = cls.type === "evaluacion" || cls.type === "practica" || cls.type === "teorico-practica";
   const classDateLabel = new Date(`${cls.date}T12:00:00`).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
   });

   const syncAssessmentGradesLoaded = (
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
   };


   const handleAddSubtopic = () => {
      const value = newSubtopic.trim();
      if (!value) {
         toast.error("Escribe un subtema valido.");
         return;
      }
      if (cls.subtopics.some((subtopic) => subtopic.toLowerCase() === value.toLowerCase())) {
         toast.error("Ese subtema ya existe.");
         return;
      }
      updateClass(cls.id, {
         subtopics: [...cls.subtopics, value],
      });
      setNewSubtopic("");
      setAddingSubtopic(false);
      toast.success("Subtema agregado.");
   };

   const resetPerformanceForm = () => {
      setPerformanceKind(defaultPerformanceKind);
      setPerformanceScore("");
      setPerformanceNote("");
      const defaultReferenceOptions =
         defaultPerformanceKind === "exam"
            ? examReferenceOptions
            : activityReferenceOptions;
      setPerformanceReferenceLabel(defaultReferenceOptions[0] ?? "");
      setEditingPerformanceKey(null);
   };

   const handleSavePerformance = () => {
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
      toast.success(
         editingPerformanceKey ? "Registro actualizado." : "Registro agregado.",
      );
      resetPerformanceForm();
   };

   const handleEditPerformance = (entry: ClassroomPerformanceEntry) => {
      setPerformanceStudentId(entry.studentId);
      setPerformanceKind(entry.kind);
      setPerformanceScore(String(entry.score));
      setPerformanceNote(entry.note ?? "");
      setPerformanceReferenceLabel(entry.referenceLabel ?? "");
      setEditingPerformanceKey(performanceEntryKey(entry));
   };

   const handleDeletePerformance = (entry: ClassroomPerformanceEntry) => {
      const nextEntries = performanceEntries.filter(
         (current) => performanceEntryKey(current) !== performanceEntryKey(entry),
      );
      setPerformanceEntries(cls.id, nextEntries);
      syncAssessmentGradesLoaded(nextEntries, entry.kind, entry.referenceLabel);
      if (editingPerformanceKey === performanceEntryKey(entry)) {
         resetPerformanceForm();
      }
      toast.success("Registro eliminado.");
   };

   const studentNameById = (studentId: string) => {
      const student = classStudents.find((item) => item.id === studentId);
      if (!student) {
         return "Alumno no encontrado";
      }
      return `${student.lastName}, ${student.name}`;
   };

   const handleBack = () => {
      if (window.history.length > 1) {
         navigate(-1);
         return;
      }
      navigate("/planificacion");
   };


   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <ClaseDictadoHeader
            subjectName={subject.name}
            classDateLabel={classDateLabel}
            classTime={cls.time}
            course={subject.course}
            isFinalized={isFinalized}
            onBack={handleBack}
            onReopenClass={() => {
               updateClass(cls.id, {
                  status: cls.topic.trim().length > 0 ? "planificada" : "sin-planificar",
               });
               toast.success("Clase reabierta. Ya puedes editar y volver a cerrarla.");
            }}
            onCloseClass={() => {
               setAttendance(cls.id, attendanceWithDefaults);
               markClassAsTaught(cls.id);
               toast.success("Clase finalizada y asistencia registrada.");
            }}
         />

         <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 space-y-6">
               <ClaseDictadoSummaryCard
                  cls={cls}
                  classTypeLabels={classTypeLabels}
                  evaluativeFormatLabelMap={evaluativeFormatLabelMap}
               />

               <ClaseDictadoSubtopicsCard
                  subtopics={cls.subtopics}
                  completedSubtopics={record.completedSubtopics}
                  addingSubtopic={addingSubtopic}
                  newSubtopic={newSubtopic}
                  isFinalized={isFinalized}
                  onToggleAdd={() => setAddingSubtopic((prev) => !prev)}
                  onNewSubtopicChange={setNewSubtopic}
                  onAddSubtopic={handleAddSubtopic}
                  onToggleSubtopic={(subtopic) => toggleSubtopic(cls.id, subtopic)}
               />

               {showGradesSection && (
               <ClaseDictadoGradesCard
                  classStudents={classStudents}
                  isFinalized={isFinalized}
                  performanceStudentId={performanceStudentId}
                  performanceReferenceLabel={performanceReferenceLabel}
                  displayedReferenceOptions={displayedReferenceOptions}
                  performanceScore={performanceScore}
                  performanceNote={performanceNote}
                  editingPerformanceKey={editingPerformanceKey}
                  performanceEntries={performanceEntries}
                  onPerformanceStudentChange={setPerformanceStudentId}
                  onPerformanceReferenceChange={setPerformanceReferenceLabel}
                  onPerformanceScoreChange={setPerformanceScore}
                  onPerformanceNoteChange={setPerformanceNote}
                  onSavePerformance={handleSavePerformance}
                  onResetPerformance={resetPerformanceForm}
                  onEditPerformance={handleEditPerformance}
                  onDeletePerformance={handleDeletePerformance}
                  studentNameById={studentNameById}
               />
               )}

               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Observaciones de dictado
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <Label className="sr-only">Observaciones</Label>
                     <Textarea
                        className="text-xs min-h-[100px] resize-none"
                        placeholder="Que salio bien, que ajustar para la proxima clase, incidencias..."
                        value={record.notes ?? ""}
                        onChange={(event) => setNotes(cls.id, event.target.value)}
                        disabled={isFinalized}
                     />
                  </CardContent>
               </Card>
            </div>

            <div className="xl:col-span-2">
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendanceWithDefaults}
                  setAttendance={(attendance) => setAttendance(cls.id, attendance)}
                  onSave={() => toast.success("Asistencia guardada.")}
               />
            </div>
         </div>
      </div>
   );
}




















