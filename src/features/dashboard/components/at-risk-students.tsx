import { AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudentsContext } from "@/features/students";
import { usePlanningContext } from "@/features/planning";
import { useClassroomContext } from "@/features/classroom";
import { getAtRiskStudentsFromLiveData } from "@/features/dashboard/utils/dashboard-derived";
import { matchesInstitutionScope } from "@/features/institution";

function computeAttendancePct(
   studentId: string,
   studentSubjectIds: string[],
   institutionClasses: Array<{ id: string; subjectId: string }>,
   getStatus: (classId: string, studentId: string) => "P" | "A" | "T" | "J" | undefined,
) {
   const subjectIdSet = new Set(studentSubjectIds);
   const statuses = institutionClasses
      .filter((classSession) => subjectIdSet.has(classSession.subjectId))
      .map((classSession) => getStatus(classSession.id, studentId))
      .filter((status): status is "P" | "A" | "T" | "J" => Boolean(status));

   if (statuses.length === 0) return 100;

   const attendedWeight = statuses.reduce((sum, status) => {
      if (status === "P" || status === "J") return sum + 1;
      if (status === "T") return sum + 0.5;
      return sum;
   }, 0);

   return Math.round((attendedWeight / statuses.length) * 100);
}

export function AtRiskStudents({ activeInstitution }: { activeInstitution: string }) {
   const { getStudentsByInstitution } = useStudentsContext();
   const { classes } = usePlanningContext();
   const { getRecord } = useClassroomContext();

   const institutionStudents = getStudentsByInstitution(activeInstitution);
   const institutionClasses = classes.filter(
      (classSession) =>
         matchesInstitutionScope(classSession.institutionId, activeInstitution),
   );

   const atRisk = getAtRiskStudentsFromLiveData(
      institutionStudents,
      institutionClasses,
      (classId, studentId) => getRecord(classId).attendance[studentId],
   ).map((student) => ({
      ...student,
      attendanceFromRecords: computeAttendancePct(
         student.id,
         student.subjectIds,
         institutionClasses,
         (classId, studentId) => getRecord(classId).attendance[studentId],
      ),
   }));

   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
               <AlertTriangle className="size-4 text-destructive" />
               Seguimiento de riesgo
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {atRisk.length === 0 ? (
               <div className="text-center py-6">
                  <AlertTriangle className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                     No hay alumnos en riesgo actualmente
                  </p>
               </div>
            ) : (
               <div className="flex flex-col gap-2.5">
                  {atRisk.map((student) => {
                     const reason =
                        student.attendanceFromRecords < 65
                           ? `${student.attendanceFromRecords}% asistencia`
                           : `Promedio ${student.average}`;
                     return (
                        <div
                           key={student.id}
                           className="flex items-center gap-2.5 py-1"
                        >
                           <Avatar className="size-7">
                              <AvatarFallback className="bg-destructive/10 text-destructive text-[10px] font-semibold">
                                 {student.name[0]}
                                 {student.lastName[0]}
                              </AvatarFallback>
                           </Avatar>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                 {student.name} {student.lastName}
                              </p>
                           </div>
                           <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] px-1.5 shrink-0">
                              {reason}
                           </Badge>
                        </div>
                     );
                  })}
               </div>
            )}
         </CardContent>
      </Card>
   );
}



