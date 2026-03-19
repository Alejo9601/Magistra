import { useState } from "react";
import { BookOpen, CalendarDays, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
   createSubject,
   deleteSubject,
   getAssignmentIdBySubjectId,
   institutions,
   subjects,
} from "@/lib/edu-repository";
import { usePlanningContext } from "@/features/planning";
import { ClassScheduleModal } from "@/features/planning/class-schedule-modal";
import {
   blockDurationOptions,
   periodFormatOptions,
   SubjectCreateDialog,
} from "@/features/settings/sections/subject-create-dialog";
import { useClassroomContext } from "@/features/classroom";
import { useStudentsContext } from "@/features/students";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { toast } from "sonner";


function periodFormatLabel(value: (typeof periodFormatOptions)[number]["value"]) {
   return periodFormatOptions.find((option) => option.value === value)?.label ?? "Trimestral";
}

export function SubjectsSection() {
   const { createRecurringClasses, removeClassesByAssignment } = usePlanningContext();
   const { removeRecordsByClassIds } = useClassroomContext();
   const { unlinkSubjectFromStudents, importSectionStudentsToAssignment } = useStudentsContext();
   const { removeAssessmentsByAssignment } = useAssessmentsContext();
   const { removeActivitiesByAssignment } = useActivitiesContext();

   const [addOpen, setAddOpen] = useState(false);
   const [institutionId, setInstitutionId] = useState(institutions[0]?.id ?? "");
   const [subjectName, setSubjectName] = useState("");
   const [course, setCourse] = useState("");
   const [periodFormat, setPeriodFormat] = useState<(typeof periodFormatOptions)[number]["value"]>("trimestral");
   const [blockDurationMinutes, setBlockDurationMinutes] = useState<(typeof blockDurationOptions)[number]["value"]>(40);
   const [copySectionStudents, setCopySectionStudents] = useState(false);
   const [scheduleOpen, setScheduleOpen] = useState(false);
   const [scheduleInstitutionId, setScheduleInstitutionId] = useState("");
   const [scheduleAssignmentId, setScheduleAssignmentId] = useState("");
   const [pendingDeleteSubjectId, setPendingDeleteSubjectId] = useState<
      string | null
   >(null);

   const groupedSubjects = institutions.map((inst) => ({
      institution: inst,
      subjects: subjects.filter((s) => s.institutionId === inst.id),
   }));

   const resetForm = () => {
      setInstitutionId(institutions[0]?.id ?? "");
      setSubjectName("");
      setCourse("");
      setPeriodFormat("trimestral");
      setBlockDurationMinutes(40);
      setCopySectionStudents(false);
   };

   const handleCreate = () => {
      if (!institutionId || !subjectName.trim() || !course.trim()) {
         toast.error("Completa institucion, materia y curso/seccion.");
         return;
      }

      const createdSubject = createSubject({
         institutionId,
         name: subjectName,
         course,
         periodFormat,
         blockDurationMinutes,
      });

      if (copySectionStudents) {
         const importResult = importSectionStudentsToAssignment(
            getAssignmentIdBySubjectId(createdSubject.id),
         );
         if (importResult.noSourceStudents) {
            toast.success("Materia creada. No habia alumnos en otras materias de la misma seccion.");
         } else if (importResult.linked > 0) {
            toast.success(
               `Materia creada. Se vincularon ${importResult.linked} alumno(s) de la misma seccion.`,
            );
         } else {
            toast.success("Materia creada. Los alumnos de la misma seccion ya estaban vinculados.");
         }
      } else {
         toast.success("Materia creada correctamente.");
      }

      setAddOpen(false);
      resetForm();
   };

   const handleDelete = (subjectId: string) => {
      const assignmentId = getAssignmentIdBySubjectId(subjectId);
      const removedClassIds = removeClassesByAssignment(assignmentId);

      removeRecordsByClassIds(removedClassIds);
      removeAssessmentsByAssignment(assignmentId);
      removeActivitiesByAssignment(assignmentId);
      unlinkSubjectFromStudents(subjectId);
      deleteSubject(subjectId);

      toast.success("Materia eliminada con sus datos relacionados.");
   };

   const openSchedule = (subjectId: string, institutionId: string) => {
      setScheduleInstitutionId(institutionId);
      setScheduleAssignmentId(getAssignmentIdBySubjectId(subjectId));
      setScheduleOpen(true);
   };

   return (
      <>
         <Card>
            <CardHeader className="pb-3">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <BookOpen className="size-4" />
                     Materias y cursos
                  </CardTitle>
                  <Button
                     variant="outline"
                     size="sm"
                     className="text-xs"
                     onClick={() => setAddOpen(true)}
                  >
                     <Plus className="size-3.5 mr-1.5" />
                     Agregar materia
                  </Button>
               </div>
            </CardHeader>
            <CardContent className="pt-0">
               {groupedSubjects.map(({ institution, subjects: instSubjects }, index) => (
                  <div key={institution.id} className="mb-4 last:mb-0">
                     <div className="flex items-center gap-2 mb-2">
                        <div
                           className="size-3 rounded-full"
                           style={{ backgroundColor: institution.color }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                           {institution.name}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1.5 pl-5">
                        {instSubjects.map((sub) => (
                           <div
                              key={sub.id}
                              className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                           >
                              <div>
                                 <span className="text-xs font-medium text-foreground">
                                    {sub.name}
                                 </span>
                                 <span className="text-xs text-muted-foreground ml-2">
                                    {sub.course} - {periodFormatLabel(sub.periodFormat)} - Bloque {sub.blockDurationMinutes ?? 40} min
                                 </span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <span className="text-[10px] text-muted-foreground">
                                    {sub.studentCount} alumnos
                                 </span>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() =>
                                       openSchedule(sub.id, institution.id)
                                    }
                                    title="Configurar cursada"
                                 >
                                    <CalendarDays className="size-3.5 text-primary" />
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => setPendingDeleteSubjectId(sub.id)}
                                    title="Eliminar materia"
                                 >
                                    <Trash2 className="size-3.5 text-destructive" />
                                 </Button>
                              </div>
                           </div>
                        ))}
                        {instSubjects.length === 0 && (
                           <p className="text-[11px] text-muted-foreground py-2">
                              Sin materias cargadas.
                           </p>
                        )}
                     </div>
                     {index < groupedSubjects.length - 1 && (
                        <Separator className="mt-3" />
                     )}
                  </div>
               ))}
            </CardContent>
         </Card>

         <SubjectCreateDialog
            open={addOpen}
            institutionId={institutionId}
            subjectName={subjectName}
            course={course}
            periodFormat={periodFormat}
            blockDurationMinutes={blockDurationMinutes}
            copySectionStudents={copySectionStudents}
            onOpenChange={(open) => {
               setAddOpen(open);
               if (!open) {
                  resetForm();
               }
            }}
            onInstitutionChange={setInstitutionId}
            onSubjectNameChange={setSubjectName}
            onCourseChange={setCourse}
            onPeriodFormatChange={setPeriodFormat}
            onBlockDurationChange={setBlockDurationMinutes}
            onCopySectionStudentsChange={setCopySectionStudents}
            onCancel={() => setAddOpen(false)}
            onSubmit={handleCreate}
         />

         <ClassScheduleModal
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            activeInstitution={scheduleInstitutionId || institutionId}
            initialInstitutionId={scheduleInstitutionId || undefined}
            initialAssignmentId={scheduleAssignmentId || undefined}
            onSchedule={(payload) => createRecurringClasses(payload)}
         />

         <AlertDialog
            open={Boolean(pendingDeleteSubjectId)}
            onOpenChange={(open) => {
               if (!open) setPendingDeleteSubjectId(null);
            }}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar materia</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta accion eliminara la materia y sus datos relacionados
                     (clases, asistencia, evaluaciones y actividades). No se puede
                     deshacer.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     onClick={() => {
                        if (!pendingDeleteSubjectId) return;
                        handleDelete(pendingDeleteSubjectId);
                        setPendingDeleteSubjectId(null);
                     }}
                  >
                     Eliminar
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
}







