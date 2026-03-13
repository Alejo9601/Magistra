import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useDashboardContext } from "@/features/dashboard";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { getSubjectsByInstitution } from "@/lib/edu-repository";
import {
   getAtRiskStudentsFromLiveData,
   getSuggestedDashboardTasks,
} from "@/features/dashboard/dashboard-derived";
import { getTodayStr } from "@/features/dashboard/constants";

export function PendingTasks({ activeInstitution }: { activeInstitution: string }) {
   const { tasks, toggleTask } = useDashboardContext();
   const { classes } = usePlanningContext();
   const { getStudentsByInstitution } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { assessments } = useAssessmentsContext();
   const { activities } = useActivitiesContext();

   const scopedTasks = tasks.filter(
      (task) => task.institutionId === activeInstitution,
   );

   const todayStr = getTodayStr();
   const scopedSubjects = getSubjectsByInstitution(activeInstitution);
   const scopedStudents = getStudentsByInstitution(activeInstitution);
   const scopedClasses = classes.filter(
      (classSession) => classSession.institutionId === activeInstitution,
   );

   const liveAtRiskStudents = getAtRiskStudentsFromLiveData(
      scopedStudents,
      scopedClasses,
      (classId, studentId) => getRecord(classId).attendance[studentId],
   );

   const suggestedTasks = getSuggestedDashboardTasks({
      todayStr,
      classes: scopedClasses,
      assessments: assessments.filter((assessment) =>
         scopedSubjects.some((subject) => subject.id === assessment.subjectId),
      ),
      activities: activities.filter((activity) =>
         scopedSubjects.some((subject) => subject.id === activity.subjectId),
      ),
      atRiskStudents: liveAtRiskStudents,
   });

   return (
      <Card id="pending-tasks" className="app-panel">
         <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
               <CheckSquare className="size-4 text-primary" />
               Cola de acciones
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
               {scopedTasks.map((task) => (
                  <label
                     key={task.id}
                     className="flex items-start gap-2.5 py-0.5 cursor-pointer group"
                  >
                     <Checkbox
                        checked={task.done}
                        onCheckedChange={(checked) =>
                           toggleTask(task.id, Boolean(checked))
                        }
                        className="mt-0.5"
                     />
                     <span
                        className={`text-xs leading-relaxed ${task.done ? "line-through text-muted-foreground" : "text-foreground group-hover:text-foreground/80"}`}
                     >
                        {task.text}
                     </span>
                  </label>
               ))}
               {scopedTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                     No hay tareas manuales para esta institucion.
                  </p>
               )}
            </div>

            {suggestedTasks.length > 0 && (
               <div className="mt-3 border-t border-border pt-2.5">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                     Sugeridas por datos actuales
                  </p>
                  <div className="flex flex-col gap-1.5">
                     {suggestedTasks.slice(0, 6).map((task) => (
                        <p key={task.id} className="text-xs text-foreground">
                           {task.text}
                        </p>
                     ))}
                  </div>
               </div>
            )}
         </CardContent>
      </Card>
   );
}
