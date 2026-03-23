import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   getAssignmentById,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import type { GroupDetailProps } from "@/features/groups/types";
import {
   GroupDetailActivitiesTab,
   GroupDetailAddActivityDialog,
   GroupDetailAddAssessmentDialog,
   GroupDetailAddStudentDialog,
   GroupDetailAssessmentsTab,
   GroupDetailDeleteDialog,
   GroupDetailPlanningTab,
   GroupDetailStudentsTab,
} from "@/features/groups/components";
import { useGroupDetailActions, useGroupDetailData } from "@/features/groups/hooks";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";

export function GroupDetail({ assignmentId, onBack }: GroupDetailProps) {
   const { getStudentsByAssignment, addStudent } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { getAssessmentsByAssignment, addAssessment, removeAssessment } =
      useAssessmentsContext();
   const { getActivitiesByAssignment, addActivity, removeActivity } =
      useActivitiesContext();

   const groupStudents = getStudentsByAssignment(assignmentId);

   const {
      addStudentOpen,
      setAddStudentOpen,
      addAssessmentOpen,
      setAddAssessmentOpen,
      addActivityOpen,
      setAddActivityOpen,
      studentSearch,
      setStudentSearch,
      newName,
      setNewName,
      newLastName,
      setNewLastName,
      newDni,
      setNewDni,
      newEmail,
      setNewEmail,
      newObservations,
      setNewObservations,
      newAssessmentTitle,
      setNewAssessmentTitle,
      newAssessmentEvaluativeFormat,
      setNewAssessmentEvaluativeFormat,
      newAssessmentDate,
      setNewAssessmentDate,
      newAssessmentStatus,
      setNewAssessmentStatus,
      newAssessmentWeight,
      setNewAssessmentWeight,
      newAssessmentMaxScore,
      setNewAssessmentMaxScore,
      newAssessmentDescription,
      setNewAssessmentDescription,
      newActivityTitle,
      setNewActivityTitle,
      newActivityType,
      setNewActivityType,
      newActivityStatus,
      setNewActivityStatus,
      newActivityDescription,
      setNewActivityDescription,
      newActivityEvaluable,
      setNewActivityEvaluable,
      newActivityRubricaId,
      setNewActivityRubricaId,
      newActivityFechaInicio,
      setNewActivityFechaInicio,
      newActivityFechaFin,
      setNewActivityFechaFin,
      pendingDelete,
      setPendingDelete,
      resetStudentForm,
      resetAssessmentForm,
      resetActivityForm,
      submitStudent,
      submitAssessment,
      submitActivity,
      confirmDelete,
   } = useGroupDetailActions({
      assignmentId,
      groupStudents,
      addStudent,
      addAssessment,
      addActivity,
      removeAssessment,
      removeActivity,
   });

   const {
      groupClasses,
      groupAssessments,
      filteredStudents,
      groupActivities,
      attendanceByStudent,
      groupAttendanceAverage,
      atRiskCount,
   } = useGroupDetailData({
      assignmentId,
      studentSearch,
      groupStudents,
      getRecord,
      getAssessmentsByAssignment,
      getActivitiesByAssignment,
   });

   const assignment = getAssignmentById(assignmentId);
   const subject = assignment ? getSubjectById(assignment.subjectId) : null;
   const inst = assignment ? getInstitutionById(assignment.institutionId) : null;

   if (!assignment || !subject || !inst) return null;

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
               <ArrowLeft className="size-4" />
            </Button>
            <div>
               <h1 className="text-xl font-bold text-foreground">{subject.name}</h1>
               <p className="text-sm text-muted-foreground">
                  {inst.name} - {assignment.section}
               </p>
            </div>
         </div>

         <Tabs defaultValue="alumnos">
            <div className="mb-1 overflow-x-auto pb-1">
               <TabsList className="w-max min-w-full">
                  <TabsTrigger value="alumnos" className="text-xs">
                     Alumnos
                  </TabsTrigger>
                  <TabsTrigger value="planificacion" className="text-xs">
                     Planificacion
                  </TabsTrigger>
                  <TabsTrigger value="evaluaciones" className="text-xs">
                     Evaluaciones
                  </TabsTrigger>
                  <TabsTrigger value="actividades" className="text-xs">
                     Actividades
                  </TabsTrigger>
               </TabsList>
            </div>

            <GroupDetailStudentsTab
               assignmentId={assignmentId}
               groupAttendanceAverage={groupAttendanceAverage}
               atRiskCount={atRiskCount}
               studentSearch={studentSearch}
               onStudentSearchChange={setStudentSearch}
               onAddStudent={() => setAddStudentOpen(true)}
               filteredStudents={filteredStudents}
               attendanceByStudent={attendanceByStudent}
            />

            <GroupDetailPlanningTab groupClasses={groupClasses} />

            <GroupDetailAssessmentsTab
               groupAssessments={groupAssessments}
               groupClasses={groupClasses}
               studentsCount={groupStudents.length}
               onAddAssessment={() => setAddAssessmentOpen(true)}
               onDeleteAssessment={(id, title) =>
                  setPendingDelete({
                     kind: "assessment",
                     id,
                     title,
                  })
               }
            />

            <GroupDetailActivitiesTab
               groupActivities={groupActivities}
               onAddActivity={() => setAddActivityOpen(true)}
               onDeleteActivity={(id, title) =>
                  setPendingDelete({
                     kind: "activity",
                     id,
                     title,
                  })
               }
            />
         </Tabs>

         <GroupDetailDeleteDialog
            pendingDelete={pendingDelete}
            onOpenChange={(open) => {
               if (!open) {
                  setPendingDelete(null);
               }
            }}
            onConfirmDelete={confirmDelete}
         />

         <GroupDetailAddStudentDialog
            open={addStudentOpen}
            onOpenChange={(open) => {
               setAddStudentOpen(open);
               if (!open) {
                  resetStudentForm();
               }
            }}
            subjectName={subject.name}
            section={assignment.section}
            name={newName}
            lastName={newLastName}
            dni={newDni}
            email={newEmail}
            observations={newObservations}
            onNameChange={setNewName}
            onLastNameChange={setNewLastName}
            onDniChange={setNewDni}
            onEmailChange={setNewEmail}
            onObservationsChange={setNewObservations}
            onSubmit={submitStudent}
         />

         <GroupDetailAddAssessmentDialog
            open={addAssessmentOpen}
            onOpenChange={(open) => {
               setAddAssessmentOpen(open);
               if (!open) {
                  resetAssessmentForm();
               }
            }}
            subjectName={subject.name}
            section={assignment.section}
            title={newAssessmentTitle}
            evaluativeFormat={newAssessmentEvaluativeFormat}
            date={newAssessmentDate}
            status={newAssessmentStatus}
            weight={newAssessmentWeight}
            maxScore={newAssessmentMaxScore}
            description={newAssessmentDescription}
            onTitleChange={setNewAssessmentTitle}
            onEvaluativeFormatChange={setNewAssessmentEvaluativeFormat}
            onDateChange={setNewAssessmentDate}
            onStatusChange={setNewAssessmentStatus}
            onWeightChange={setNewAssessmentWeight}
            onMaxScoreChange={setNewAssessmentMaxScore}
            onDescriptionChange={setNewAssessmentDescription}
            onSubmit={submitAssessment}
         />

         <GroupDetailAddActivityDialog
            open={addActivityOpen}
            onOpenChange={(open) => {
               setAddActivityOpen(open);
               if (!open) {
                  resetActivityForm();
               }
            }}
            subjectName={subject.name}
            section={assignment.section}
            title={newActivityTitle}
            type={newActivityType}
            status={newActivityStatus}
            esEvaluable={newActivityEvaluable}
            rubricaId={newActivityRubricaId}
            fechaInicio={newActivityFechaInicio}
            fechaFin={newActivityFechaFin}
            description={newActivityDescription}
            onTitleChange={setNewActivityTitle}
            onTypeChange={setNewActivityType}
            onStatusChange={setNewActivityStatus}
            onEsEvaluableChange={setNewActivityEvaluable}
            onRubricaIdChange={setNewActivityRubricaId}
            onFechaInicioChange={setNewActivityFechaInicio}
            onFechaFinChange={setNewActivityFechaFin}
            onDescriptionChange={setNewActivityDescription}
            onSubmit={submitActivity}
         />
      </div>
   );
}
