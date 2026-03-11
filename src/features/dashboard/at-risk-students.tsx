import { AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudentsContext } from "@/features/students";

export function AtRiskStudents({ activeInstitution }: { activeInstitution: string }) {
   const { getStudentsByInstitution } = useStudentsContext();
   const atRisk = getStudentsByInstitution(activeInstitution).filter(
      (s) => s.status === "en-riesgo",
   );

   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
               <AlertTriangle className="size-4 text-destructive" />
               Alumnos en riesgo
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
                        student.attendance < 65
                           ? `${student.attendance}% asistencia`
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



