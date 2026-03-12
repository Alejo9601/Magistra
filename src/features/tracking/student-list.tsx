import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { useStudentsContext } from "@/features/students";
import { usePlanningContext } from "@/features/planning";
import { useClassroomContext } from "@/features/classroom";

type RiskLevel = "high" | "medium" | "low";

function getRiskLevel(attendance: number, average: number): RiskLevel {
   if (attendance < 65 || average < 6) return "high";
   if (attendance < 80 || average < 7) return "medium";
   return "low";
}

export function StudentList({
   onSelect,
   activeInstitution,
   statusFilter,
}: {
   onSelect: (id: string) => void;
   activeInstitution: string;
   statusFilter?: "en-riesgo" | "regular" | "destacado";
}) {
   const { getStudentsByInstitution } = useStudentsContext();
   const { classes } = usePlanningContext();
   const { getRecord } = useClassroomContext();
   const [search, setSearch] = useState("");

   const searchedStudents = getStudentsByInstitution(activeInstitution).filter((student) =>
      `${student.name} ${student.lastName}`
         .toLowerCase()
         .includes(search.toLowerCase()),
   );

   const studentStats = useMemo(() => {
      const classesInInstitution = classes.filter(
         (classSession) => classSession.institutionId === activeInstitution,
      );
      const output = new Map<
         string,
         { attendance: number; absences: number; lateness: number; risk: RiskLevel }
      >();

      searchedStudents.forEach((student) => {
         const subjectIdSet = new Set(student.subjectIds);
         const relevantClasses = classesInInstitution.filter((classSession) =>
            subjectIdSet.has(classSession.subjectId),
         );
         const statuses = relevantClasses
            .map((classSession) => getRecord(classSession.id).attendance[student.id])
            .filter((status): status is "P" | "A" | "T" | "J" => Boolean(status));

         const absences = statuses.filter((status) => status === "A").length;
         const lateness = statuses.filter((status) => status === "T").length;

         if (statuses.length === 0) {
            output.set(student.id, {
               attendance: student.attendance,
               absences: 0,
               lateness: 0,
               risk: getRiskLevel(student.attendance, student.average),
            });
            return;
         }

         const attendedWeight = statuses.reduce((sum, status) => {
            if (status === "P" || status === "J") return sum + 1;
            if (status === "T") return sum + 0.5;
            return sum;
         }, 0);
         const attendance = Math.round((attendedWeight / statuses.length) * 100);

         output.set(student.id, {
            attendance,
            absences,
            lateness,
            risk: getRiskLevel(attendance, student.average),
         });
      });

      return output;
   }, [activeInstitution, classes, searchedStudents, getRecord]);

   const filtered = useMemo(
      () =>
         searchedStudents.filter((student) => {
            if (!statusFilter) {
               return true;
            }
            if (statusFilter === "en-riesgo") {
               const stats = studentStats.get(student.id);
               return stats?.risk === "high" || student.status === "en-riesgo";
            }
            return student.status === statusFilter;
         }),
      [searchedStudents, statusFilter, studentStats],
   );

   return (
      <div className="p-6 max-w-7xl mx-auto">
         <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Seguimiento</h1>
            <p className="text-sm text-muted-foreground">
               Vista longitudinal por alumno: riesgo, alertas y evolucion
            </p>
         </div>

         <div className="relative max-w-sm mb-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
               className="h-9 pl-8 text-xs"
               placeholder="Buscar alumno por nombre..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>

         <Card>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className="text-xs">Alumno</TableHead>
                        <TableHead className="text-xs">Asistencia</TableHead>
                        <TableHead className="text-xs">Promedio</TableHead>
                        <TableHead className="text-xs">Alertas</TableHead>
                        <TableHead className="text-xs">Riesgo</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filtered.map((student) => {
                        const stats =
                           studentStats.get(student.id) ??
                           {
                              attendance: student.attendance,
                              absences: 0,
                              lateness: 0,
                              risk: getRiskLevel(student.attendance, student.average),
                           };
                        return (
                           <TableRow
                              key={student.id}
                              className="hover:bg-muted/30 cursor-pointer"
                              onClick={() => onSelect(student.id)}
                           >
                              <TableCell>
                                 <div className="flex items-center gap-2.5">
                                    <Avatar className="size-7">
                                       <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                                          {student.name[0]}
                                          {student.lastName[0]}
                                       </AvatarFallback>
                                    </Avatar>
                                    <div>
                                       <p className="text-xs font-medium">
                                          {student.lastName}, {student.name}
                                       </p>
                                       <p className="text-[10px] text-muted-foreground">
                                          {student.dni}
                                       </p>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="text-xs">{stats.attendance}%</TableCell>
                              <TableCell className="text-xs font-medium">
                                 {student.average.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                 <div className="flex gap-1">
                                    <Badge variant="secondary" className="text-[10px]">
                                       A: {stats.absences}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px]">
                                       T: {stats.lateness}
                                    </Badge>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Badge
                                    className={`border-0 text-[10px] capitalize ${
                                       stats.risk === "high"
                                          ? "bg-destructive/15 text-destructive"
                                          : stats.risk === "medium"
                                            ? "bg-warning/15 text-warning-foreground"
                                            : "bg-success/15 text-success"
                                    }`}
                                 >
                                    {stats.risk === "high"
                                       ? "alto"
                                       : stats.risk === "medium"
                                         ? "medio"
                                         : "bajo"}
                                 </Badge>
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
