import { useState } from "react";
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
import { AttendanceCard } from "@/features/classroom/components/attendance-card";
import { classTypeLabels } from "@/features/classroom/utils/classroom-constants";
import { ClaseDictadoHeader } from "@/features/classroom/components/clase-dictado-header";
import { ClaseDictadoSummaryCard } from "@/features/classroom/components/clase-dictado-summary-card";
import { ClaseDictadoSubtopicsCard } from "@/features/classroom/components/clase-dictado-subtopics-card";
import { ClaseDictadoGradesCard } from "@/features/classroom/components/clase-dictado-grades-card";
import { useClasePerformance } from "@/features/classroom/hooks";
import { evaluativeFormatLabelMap } from "@/features/classroom/utils";
import type { AttendanceStatus } from "@/features/classroom/types";

export function ClaseDictadoContent() {
   const params = useParams();
   const navigate = useNavigate();
   const classId = params.id as string;
   const { classes, markClassAsTaught, updateClass } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const { getRecord, toggleSubtopic, setAttendance, setNotes, setPerformanceEntries } =
      useClassroomContext();
   const { getActivitiesByAssignment } = useActivitiesContext();
   const { getAssessmentsByAssignment, updateAssessment } = useAssessmentsContext();

   const [addingSubtopic, setAddingSubtopic] = useState(false);
   const [newSubtopic, setNewSubtopic] = useState("");

   const cls = classes.find((classSession) => classSession.id === classId);
   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const institution = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];
   const subjectActivities = assignmentId ? getActivitiesByAssignment(assignmentId) : [];
   const subjectAssessments = assignmentId ? getAssessmentsByAssignment(assignmentId) : [];

   if (!cls || !subject || !institution) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const record = getRecord(cls.id);
   const performanceEntries = record.performanceEntries;

   const performance = useClasePerformance({
      cls,
      subject,
      classStudents,
      subjectActivities,
      subjectAssessments,
      performanceEntries,
      setPerformanceEntries,
      updateAssessment,
   });

   const attendanceWithDefaults: Record<string, AttendanceStatus> = Object.fromEntries(
      classStudents.map((student) => [
         student.id,
         record.attendance[student.id] ?? ("P" as AttendanceStatus),
      ]),
   );
   const isFinalized = cls.status === "finalizada";
   const showGradesSection =
      cls.type === "evaluacion" || cls.type === "practica" || cls.type === "teorico-practica";
   const classDateLabel = new Date(`${cls.date}T12:00:00`).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
   });

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
                     performanceStudentId={performance.performanceStudentId}
                     performanceReferenceLabel={performance.performanceReferenceLabel}
                     displayedReferenceOptions={performance.displayedReferenceOptions}
                     performanceScore={performance.performanceScore}
                     performanceNote={performance.performanceNote}
                     editingPerformanceKey={performance.editingPerformanceKey}
                     performanceEntries={performanceEntries}
                     availableRubrics={performance.availableRubrics}
                     useRubricMode={performance.useRubricMode}
                     selectedRubricId={performance.selectedRubricId}
                     rubricCriterionSelections={performance.rubricCriterionSelections}
                     rubricComputedScore={performance.rubricComputedScore}
                     onUseRubricModeChange={performance.setUseRubricMode}
                     onSelectedRubricChange={performance.setSelectedRubricId}
                     onRubricCriterionChange={performance.setRubricCriterionSelection}
                     onApplyRubricScore={performance.applyRubricScore}
                     onPerformanceStudentChange={performance.setPerformanceStudentId}
                     onPerformanceReferenceChange={performance.setPerformanceReferenceLabel}
                     onPerformanceScoreChange={performance.setPerformanceScore}
                     onPerformanceNoteChange={performance.setPerformanceNote}
                     onSavePerformance={performance.handleSavePerformance}
                     onResetPerformance={performance.resetPerformanceForm}
                     onEditPerformance={performance.handleEditPerformance}
                     onDeletePerformance={performance.handleDeletePerformance}
                     studentNameById={performance.studentNameById}
                  />
               )}

               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">Observaciones de dictado</CardTitle>
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




