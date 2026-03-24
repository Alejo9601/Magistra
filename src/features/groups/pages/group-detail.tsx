import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   getAssignmentById,
   getInstitutionById,
   getSubjectById,
   updateSubjectGradingScheme,
} from "@/lib/edu-repository";
import { createDefaultRubricCriterion, createDefaultSubjectRubric, normalizeSubjectGradingScheme } from "@/lib/grading-schemes";
import type { GroupDetailProps } from "@/features/groups/types";
import {
   GroupDetailActivitiesTab,
   GroupDetailAddActivityDialog,
   GroupDetailAddStudentDialog,
   GroupDetailDeleteDialog,
   GroupDetailPlanningTab,
   GroupDetailStudentsTab,
} from "@/features/groups/components";
import { useGroupDetailActions, useGroupDetailData } from "@/features/groups/hooks";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useActivitiesContext } from "@/features/activities";
import { toast } from "sonner";

export function GroupDetail({ assignmentId, onBack }: GroupDetailProps) {
   const navigate = useNavigate();
   const { getStudentsByAssignment, addStudent } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { getActivitiesByAssignment, addActivity, removeActivity } =
      useActivitiesContext();

   const groupStudents = getStudentsByAssignment(assignmentId);

   const {
      addStudentOpen,
      setAddStudentOpen,
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
      resetActivityForm,
      submitStudent,
      submitActivity,
      confirmDelete,
   } = useGroupDetailActions({
      assignmentId,
      groupStudents,
      addStudent,
      addAssessment: () => undefined,
      addActivity,
      removeAssessment: () => undefined,
      removeActivity,
   });

   const {
      groupClasses,
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
      getActivitiesByAssignment,
   });

   const assignment = getAssignmentById(assignmentId);
   const subject = assignment ? getSubjectById(assignment.subjectId) : null;
   const inst = assignment ? getInstitutionById(assignment.institutionId) : null;

   if (!assignment || !subject || !inst) return null;

   const rubricOptions = (subject.gradingScheme?.rubrics ?? []).map((rubric) => ({
      id: rubric.id,
      name: rubric.name,
   }));

   const handleCreateRubricForActivity = (payload: {
      name: string;
      criteria: Array<{ name: string; weight: number }>;
   }) => {
      const rubricName = payload.name.trim();
      const criteria = payload.criteria
         .map((criterion) => ({
            name: criterion.name.trim(),
            weight: Math.max(1, Math.round(criterion.weight)),
         }))
         .filter((criterion) => criterion.name.length > 0);

      if (!rubricName) {
         toast.error("Escribe un nombre para la rubrica.");
         return;
      }
      if (criteria.length === 0) {
         toast.error("Agrega al menos un criterio valido.");
         return;
      }

      const currentScheme = normalizeSubjectGradingScheme(subject.gradingScheme);
      const nextRubric = createDefaultSubjectRubric({
         name: rubricName,
         targetType: "practica",
         evaluativeFormat: "cualquiera",
         criteria: criteria.map((criterion) =>
            createDefaultRubricCriterion({
               name: criterion.name,
               weight: criterion.weight,
            }),
         ),
      });

      const updated = updateSubjectGradingScheme(subject.id, {
         ...currentScheme,
         rubrics: [...currentScheme.rubrics, nextRubric],
      });

      if (!updated) {
         toast.error("No se pudo crear la rubrica.");
         return;
      }

      setNewActivityEvaluable(true);
      setNewActivityRubricaId(nextRubric.id);
      toast.success("Rubrica creada y seleccionada para la actividad.");
   };

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

            <GroupDetailActivitiesTab
               groupActivities={groupActivities}
               onAddActivity={() => setAddActivityOpen(true)}
               onGradeActivity={(activityId) => navigate(`/actividad/${activityId}/calificar`)}
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
            rubricOptions={rubricOptions}
            fechaInicio={newActivityFechaInicio}
            fechaFin={newActivityFechaFin}
            description={newActivityDescription}
            onTitleChange={setNewActivityTitle}
            onTypeChange={setNewActivityType}
            onStatusChange={setNewActivityStatus}
            onEsEvaluableChange={setNewActivityEvaluable}
            onRubricaIdChange={setNewActivityRubricaId}
            onCreateRubric={handleCreateRubricForActivity}
            onFechaInicioChange={setNewActivityFechaInicio}
            onFechaFinChange={setNewActivityFechaFin}
            onDescriptionChange={setNewActivityDescription}
            onSubmit={submitActivity}
         />
      </div>
   );
}

