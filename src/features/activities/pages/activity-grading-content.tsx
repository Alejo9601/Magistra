import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getAssignmentIdBySubjectId, getSubjectById } from "@/lib/edu-repository";
import { useActivitiesContext } from "@/features/activities";
import { useStudentsContext } from "@/features/students";
import { ActivityGradingHeader } from "@/features/activities/components/activity-grading-header";
import { ActivityGradingStudentCard } from "@/features/activities/components/activity-grading-student-card";
import {
   clampScore,
   computeRubricScore,
   scoreDescriptor,
   upsertStudentGrade,
} from "@/features/activities/utils/activity-grading-utils";
import type { ActivityStudentGrade } from "@/types";

export function ActivityGradingContent() {
   const params = useParams();
   const navigate = useNavigate();
   const activityId = params.id as string;

   const { getActivityById, updateActivity } = useActivitiesContext();
   const { getStudentsByAssignment } = useStudentsContext();

   const activity = getActivityById(activityId);
   const assignmentId = activity
      ? activity.assignmentId ?? getAssignmentIdBySubjectId(activity.subjectId)
      : "";

   const students = assignmentId ? getStudentsByAssignment(assignmentId) : [];
   const subject = activity ? getSubjectById(activity.subjectId) : null;

   const gradingScheme = subject?.gradingScheme;
   const scale = gradingScheme?.scale ?? "numeric-10";
   const rounding = gradingScheme?.rounding ?? "nearest";

   const rubric = useMemo(() => {
      if (!activity?.rubricaId || !gradingScheme) {
         return null;
      }
      return gradingScheme.rubrics.find((item) => item.id === activity.rubricaId) ?? null;
   }, [activity?.rubricaId, gradingScheme]);

   const [activeStudentIndex, setActiveStudentIndex] = useState(0);

   if (!activity || !subject) {
      return (
         <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Actividad no encontrada.</p>
         </div>
      );
   }

   if (students.length === 0) {
      return (
         <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">No hay estudiantes en este curso.</p>
         </div>
      );
   }

   const grades = activity.grades ?? [];

   const getGradeForStudent = (studentId: string): ActivityStudentGrade => {
      const existing = grades.find((grade) => grade.studentId === studentId);
      if (existing) {
         return existing;
      }
      return {
         studentId,
         status: "pending",
         updatedAt: new Date().toISOString(),
      };
   };

   const persistStudentGrade = (nextGrade: ActivityStudentGrade) => {
      const nextGrades = upsertStudentGrade(grades, {
         ...nextGrade,
         updatedAt: new Date().toISOString(),
      });
      updateActivity(activity.id, { grades: nextGrades });
   };

   const completedCount = grades.filter((grade) => grade.status === "complete").length;

   const activeStudent = students[Math.max(0, Math.min(activeStudentIndex, students.length - 1))];
   const activeGrade = getGradeForStudent(activeStudent.id);

   const rubricResult = rubric
      ? computeRubricScore({
           rubric,
           criteriaScores: activeGrade.criteriaScores ?? {},
           scale,
           rounding,
        })
      : null;

   const activeDescriptor =
      typeof activeGrade.score === "number"
         ? scoreDescriptor(activeGrade.score, scale)
         : rubricResult && rubricResult.hasAllCriteria && typeof rubricResult.score === "number"
            ? scoreDescriptor(rubricResult.score, scale)
            : undefined;

   return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
         <ActivityGradingHeader
            title={activity.title}
            courseLabel={`${subject.name} - ${subject.course}`}
            progressLabel={`${completedCount} / ${students.length} alumnos evaluados`}
            onBack={() => navigate("/grupos")}
         />

         <div className="mb-3 flex items-center justify-between gap-2">
            <Button
               type="button"
               variant="outline"
               size="sm"
               className="text-xs"
               onClick={() => setActiveStudentIndex((prev) => Math.max(0, prev - 1))}
               disabled={activeStudentIndex <= 0}
            >
               <ChevronLeft className="mr-1.5 size-3.5" />
               Anterior
            </Button>
            <Button
               type="button"
               variant="outline"
               size="sm"
               className="text-xs"
               onClick={() =>
                  setActiveStudentIndex((prev) => Math.min(students.length - 1, prev + 1))
               }
               disabled={activeStudentIndex >= students.length - 1}
            >
               Siguiente
               <ChevronRight className="ml-1.5 size-3.5" />
            </Button>
         </div>

         <ActivityGradingStudentCard
            studentLabel={`${activeStudent.lastName}, ${activeStudent.name}`}
            grade={activeGrade}
            rubric={rubric}
            scale={scale}
            rubricFinalScore={rubricResult?.score ?? null}
            descriptor={activeDescriptor}
            onDirectScoreChange={(value) => {
               const parsed = Number(value);
               const hasScore = value.trim().length > 0 && Number.isFinite(parsed);
               const score = hasScore ? clampScore(parsed, scale) : undefined;
               persistStudentGrade({
                  ...activeGrade,
                  score,
                  status: score === undefined ? "pending" : activeGrade.status,
               });
            }}
            onRubricCriterionChange={(criterionId, value) => {
               const parsed = Number(value);
               const hasValue = value.trim().length > 0 && Number.isFinite(parsed);
               const criteriaScores = {
                  ...(activeGrade.criteriaScores ?? {}),
               };
               if (hasValue) {
                  criteriaScores[criterionId] = clampScore(parsed, scale);
               } else {
                  delete criteriaScores[criterionId];
               }

               const result = computeRubricScore({
                  rubric: rubric!,
                  criteriaScores,
                  scale,
                  rounding,
               });

               persistStudentGrade({
                  ...activeGrade,
                  criteriaScores,
                  score: result?.hasAllCriteria ? result.score : undefined,
                  status: result?.hasAllCriteria ? "complete" : "pending",
               });
            }}
            onMarkComplete={() => {
               if (activeGrade.score === undefined) {
                  toast.error("Carga una nota para marcar como completa.");
                  return;
               }
               persistStudentGrade({
                  ...activeGrade,
                  status: "complete",
               });
               toast.success("Calificacion marcada como completa.");
            }}
         />

         <Card className="mt-4">
            <CardHeader className="pb-3">
               <CardTitle className="text-sm font-semibold">Resumen por alumno</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className="text-xs">Alumno</TableHead>
                        <TableHead className="text-xs">Nota</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {students.map((student) => {
                        const studentGrade = getGradeForStudent(student.id);
                        return (
                           <TableRow
                              key={student.id}
                              className="cursor-pointer"
                              onClick={() => {
                                 const idx = students.findIndex((item) => item.id === student.id);
                                 if (idx >= 0) {
                                    setActiveStudentIndex(idx);
                                 }
                              }}
                           >
                              <TableCell className="text-xs">
                                 {student.lastName}, {student.name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                 {typeof studentGrade.score === "number" ? studentGrade.score : "-"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                 {studentGrade.status === "complete" ? "Completa" : "Pendiente"}
                              </TableCell>
                           </TableRow>
                        );
                     })}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   );
}
