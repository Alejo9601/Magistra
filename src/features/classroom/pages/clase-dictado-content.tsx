import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ClaseDictadoActivitiesCard } from "@/features/classroom/components/clase-dictado-activities-card";
import { ClaseDictadoCreateActivityDialog } from "@/features/classroom/components/clase-dictado-create-activity-dialog";
import { ClaseDictadoLinkActivitiesDialog } from "@/features/classroom/components/clase-dictado-link-activities-dialog";
import { ClaseDictadoCloseDialog } from "@/features/classroom/components/clase-dictado-close-dialog";
import { ClaseDictadoNotesCard } from "@/features/classroom/components/clase-dictado-notes-card";
import { ClaseDictadoAttendanceLockCard } from "@/features/classroom/components/clase-dictado-attendance-lock-card";
import { useClasePerformance } from "@/features/classroom/hooks";
import { evaluativeFormatLabelMap } from "@/features/classroom/utils";
import type { AttendanceStatus } from "@/features/classroom/types";
import type { ActivityType } from "@/types";

export function ClaseDictadoContent() {
   const params = useParams();
   const navigate = useNavigate();
   const classId = params.id as string;
   const { classes, updateClass } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const {
      getRecord,
      toggleSubtopic,
      setCompletedSubtopics,
      setAttendance,
      setNotes,
      setPerformanceEntries,
   } = useClassroomContext();
   const { getActivitiesByAssignment, toggleActivityLink, addActivity } = useActivitiesContext();
   const { getAssessmentsByAssignment, updateAssessment } = useAssessmentsContext();

   const [addingSubtopic, setAddingSubtopic] = useState(false);
   const [newSubtopic, setNewSubtopic] = useState("");
   const [linkDialogOpen, setLinkDialogOpen] = useState(false);
   const [linkSearch, setLinkSearch] = useState("");
   const [selectedExistingActivityIds, setSelectedExistingActivityIds] = useState<string[]>([]);
   const [createDialogOpen, setCreateDialogOpen] = useState(false);
   const [newActivityTitle, setNewActivityTitle] = useState("");
   const [newActivityType, setNewActivityType] = useState<ActivityType>("practica");
   const [newActivityDescription, setNewActivityDescription] = useState("");
   const [newActivityEvaluable, setNewActivityEvaluable] = useState(false);
   const [closeDialogOpen, setCloseDialogOpen] = useState(false);
   const [attendanceLockedByFinalized, setAttendanceLockedByFinalized] = useState(false);
   const [activityBaseline, setActivityBaseline] = useState<{
      classId: string;
      linkedActivityIds: string[];
   }>({ classId: "", linkedActivityIds: [] });

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

   const linkedActivities = useMemo(
      () =>
         [...subjectActivities]
            .filter((activity) => activity.linkedClassIds.includes(cls.id))
            .sort((a, b) => a.title.localeCompare(b.title)),
      [cls.id, subjectActivities],
   );

   const linkedActivitiesSummary = useMemo(() => {
      const total = linkedActivities.length;
      const evaluables = linkedActivities.filter((activity) => activity.esEvaluable).length;
      const completed = linkedActivities.filter((activity) => activity.status === "completed").length;
      return {
         total,
         evaluables,
         completed,
         pending: total - completed,
      };
   }, [linkedActivities]);

   const filteredUnlinkedActivities = useMemo(() => {
      const unlinked = subjectActivities.filter(
         (activity) => !activity.linkedClassIds.includes(cls.id),
      );
      const query = linkSearch.trim().toLowerCase();
      if (!query) {
         return unlinked.sort((a, b) => a.title.localeCompare(b.title));
      }
      return unlinked
         .filter((activity) => activity.title.toLowerCase().includes(query))
         .sort((a, b) => a.title.localeCompare(b.title));
   }, [cls.id, linkSearch, subjectActivities]);

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
   const isFinalized = cls.status === "dictada";
   const showGradesSection =
      cls.type === "evaluacion" || cls.type === "practica" || cls.type === "teorico-practica";
   const classDateLabel = new Date(`${cls.date}T12:00:00`).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
   });

   useEffect(() => {
      if (activityBaseline.classId === cls.id) {
         return;
      }
      setActivityBaseline({
         classId: cls.id,
         linkedActivityIds: linkedActivities.map((activity) => activity.id),
      });
   }, [activityBaseline.classId, cls.id, linkedActivities]);

   useEffect(() => {
      setAttendanceLockedByFinalized(isFinalized);
   }, [cls.id, isFinalized]);

   useEffect(() => {
      if (cls.status === "planificada") {
         updateClass(cls.id, { status: "en_curso" });
      }
   }, [cls.id, cls.status, updateClass]);

   const closeAnalysis = useMemo(() => {
      const plannedSubtopics = cls.subtopics.map((item) => item.trim()).filter(Boolean);
      const plannedSubtopicsSet = new Set(plannedSubtopics);
      const completedSubtopics = record.completedSubtopics;

      const missingSubtopics = plannedSubtopics.filter(
         (subtopic) => !completedSubtopics.includes(subtopic),
      );
      const hasUnplannedCompletedSubtopics = completedSubtopics.some(
         (subtopic) => !plannedSubtopicsSet.has(subtopic),
      );
      const hasInitialSubtopicState =
         completedSubtopics.length === 0 && !hasUnplannedCompletedSubtopics;
      const subtopicsModified =
         hasUnplannedCompletedSubtopics ||
         (completedSubtopics.length > 0 && missingSubtopics.length > 0);

      const currentLinkedIds = linkedActivities.map((activity) => activity.id);
      const baselineSet = new Set(activityBaseline.linkedActivityIds);
      const currentSet = new Set(currentLinkedIds);

      const addedActivities = linkedActivities
         .filter((activity) => !baselineSet.has(activity.id))
         .map((activity) => activity.title);
      const removedActivities = subjectActivities
         .filter(
            (activity) => baselineSet.has(activity.id) && !currentSet.has(activity.id),
         )
         .map((activity) => activity.title);
      const activitiesModified = addedActivities.length > 0 || removedActivities.length > 0;

      const hasManualChanges =
         (record.notes?.trim().length ?? 0) > 0 ||
         record.completedActivities.length > 0 ||
         performanceEntries.length > 0;

      const hasChanges = subtopicsModified || activitiesModified || hasManualChanges;

      return {
         hasChanges,
         hasInitialSubtopicState,
         missingSubtopics,
         coveredSubtopics: plannedSubtopics.filter((subtopic) => !missingSubtopics.includes(subtopic)),
         addedActivities,
         removedActivities,
      };
   }, [
      cls.subtopics,
      activityBaseline.linkedActivityIds,
      linkedActivities,
      performanceEntries.length,
      record.completedActivities.length,
      record.completedSubtopics,
      record.notes,
      subjectActivities,
   ]);

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

   const handleToggleExistingSelection = (activityId: string) => {
      setSelectedExistingActivityIds((prev) =>
         prev.includes(activityId)
            ? prev.filter((id) => id !== activityId)
            : [...prev, activityId],
      );
   };

   const handleLinkSelectedActivities = () => {
      if (selectedExistingActivityIds.length === 0) {
         toast.error("Selecciona al menos una actividad para vincular.");
         return;
      }

      selectedExistingActivityIds.forEach((activityId) => {
         toggleActivityLink(activityId, cls.id);
      });

      const linkedCount = selectedExistingActivityIds.length;
      setSelectedExistingActivityIds([]);
      setLinkSearch("");
      setLinkDialogOpen(false);
      toast.success(
         linkedCount === 1
            ? "1 actividad vinculada correctamente."
            : `${linkedCount} actividades vinculadas correctamente.`,
      );
   };

   const handleUnlinkActivity = (activityId: string) => {
      toggleActivityLink(activityId, cls.id);
      toast.success("Actividad desvinculada de la clase.");
   };
   const resetNewActivityForm = () => {
      setNewActivityTitle("");
      setNewActivityType("practica");
      setNewActivityDescription("");
      setNewActivityEvaluable(false);
   };

   const handleCreateActivity = () => {
      const title = newActivityTitle.trim();
      if (!title) {
         toast.error("Completa el nombre de la actividad.");
         return;
      }
      if (!assignmentId) {
         toast.error("No se pudo identificar el grupo para esta clase.");
         return;
      }

      addActivity({
         assignmentId,
         title,
         description: newActivityDescription.trim() || undefined,
         type: newActivityType,
         esEvaluable: newActivityEvaluable,
         status: "assigned",
         fechaInicio: cls.date,
         linkedClassIds: [cls.id],
      });

      setCreateDialogOpen(false);
      resetNewActivityForm();
      toast.success("Actividad creada y vinculada a la clase.");
   };

   const handleFinalizeClass = () => {
      if (closeAnalysis.hasInitialSubtopicState && cls.subtopics.length > 0) {
         setCompletedSubtopics(cls.id, cls.subtopics);
      }

      setAttendance(cls.id, attendanceWithDefaults);
      updateClass(cls.id, {
         status: "dictada",
         closureType: closeAnalysis.hasChanges ? "modificada" : "planificada",
      });
      setCloseDialogOpen(false);

      toast.success(
         closeAnalysis.hasChanges
            ? "Clase dictada con modificaciones registradas."
            : "Clase dictada segun lo planificado.",
      );
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
                  status: cls.topic.trim().length > 0 ? "planificada" : "sin_planificar",
                  closureType: undefined,
               });
               toast.success("Clase reabierta. Ya puedes editar y volver a cerrarla.");
            }}
            onCloseClass={() => setCloseDialogOpen(true)}
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

               <ClaseDictadoNotesCard
                  notes={record.notes ?? ""}
                  isFinalized={isFinalized}
                  onNotesChange={(value) => setNotes(cls.id, value)}
               />
            </div>

            <div className="xl:col-span-2 space-y-4">
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendanceWithDefaults}
                  setAttendance={(attendance) => setAttendance(cls.id, attendance)}
                  onSave={() => toast.success("Asistencia guardada.")}
                  disabled={attendanceLockedByFinalized}
               />
               {attendanceLockedByFinalized ? (
                  <ClaseDictadoAttendanceLockCard
                     onEnableManualEdit={() => {
                        setAttendanceLockedByFinalized(false);
                        toast.warning("Edicion manual de asistencia habilitada para clase dictada.");
                     }}
                  />
               ) : null}

               <ClaseDictadoActivitiesCard
                  isFinalized={isFinalized}
                  linkedActivitiesSummary={linkedActivitiesSummary}
                  linkedActivities={linkedActivities}
                  onCreateActivity={() => setCreateDialogOpen(true)}
                  onOpenLinkDialog={() => setLinkDialogOpen(true)}
                  onUnlinkActivity={handleUnlinkActivity}
               />
            </div>
         </div>

         <ClaseDictadoCreateActivityDialog
            open={createDialogOpen}
            onOpenChange={(open) => {
               setCreateDialogOpen(open);
               if (!open) {
                  resetNewActivityForm();
               }
            }}
            title={newActivityTitle}
            activityType={newActivityType}
            description={newActivityDescription}
            evaluable={newActivityEvaluable}
            onTitleChange={setNewActivityTitle}
            onActivityTypeChange={setNewActivityType}
            onDescriptionChange={setNewActivityDescription}
            onEvaluableChange={setNewActivityEvaluable}
            onCancel={() => setCreateDialogOpen(false)}
            onCreate={handleCreateActivity}
         />
         <ClaseDictadoLinkActivitiesDialog
            open={linkDialogOpen}
            onOpenChange={(open) => {
               setLinkDialogOpen(open);
               if (!open) {
                  setSelectedExistingActivityIds([]);
                  setLinkSearch("");
               }
            }}
            search={linkSearch}
            onSearchChange={setLinkSearch}
            activities={filteredUnlinkedActivities}
            selectedActivityIds={selectedExistingActivityIds}
            onToggleSelection={handleToggleExistingSelection}
            onCancel={() => setLinkDialogOpen(false)}
            onLink={handleLinkSelectedActivities}
         />
         <ClaseDictadoCloseDialog
            open={closeDialogOpen}
            onOpenChange={setCloseDialogOpen}
            closeAnalysis={closeAnalysis}
            onConfirm={handleFinalizeClass}
         />
      </div>
   );
}
