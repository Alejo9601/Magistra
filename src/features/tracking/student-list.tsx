import { useMemo, useState } from "react";
import { FilterX, Search, SearchX, Users } from "lucide-react";
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

type RiskLevel = "high" | "medium" | "low" | "no-data";

function getRiskLevel(params: {
   attendance: number;
   average: number;
   attendanceSamples: number;
   manualStatus: "regular" | "en-riesgo" | "destacado";
}): RiskLevel {
   const { attendance, average, attendanceSamples, manualStatus } = params;
   if (manualStatus === "en-riesgo") return "high";

   const hasGrades = average > 0;
   const hasEnoughAttendanceEvidence = attendanceSamples >= 2;

   if (!hasGrades && !hasEnoughAttendanceEvidence) {
      return "no-data";
   }

   if (attendance < 65 || (hasGrades && average < 6)) return "high";
   if (attendance < 80 || (hasGrades && average < 7)) return "medium";
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

   const institutionStudents = getStudentsByInstitution(activeInstitution);
   const searchedStudents = institutionStudents.filter((student) =>
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
         {
            attendance: number;
            attendanceSamples: number;
            absences: number;
            lateness: number;
            risk: RiskLevel;
         }
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
            const attendance = student.attendance;
            output.set(student.id, {
               attendance,
               attendanceSamples: 0,
               absences: 0,
               lateness: 0,
               risk: getRiskLevel({
                  attendance,
                  average: student.average,
                  attendanceSamples: 0,
                  manualStatus: student.status,
               }),
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
            attendanceSamples: statuses.length,
            absences,
            lateness,
            risk: getRiskLevel({
               attendance,
               average: student.average,
               attendanceSamples: statuses.length,
               manualStatus: student.status,
            }),
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

   const isInstitutionEmpty = institutionStudents.length === 0;
   const isSearchEmpty =
      !isInstitutionEmpty && search.trim().length > 0 && searchedStudents.length === 0;
   const isFilterEmpty =
      !isInstitutionEmpty &&
      !isSearchEmpty &&
      searchedStudents.length > 0 &&
      filtered.length === 0;

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
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
               <Table className="min-w-[720px]">
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
                              attendanceSamples: 0,
                              absences: 0,
                              lateness: 0,
                              risk: getRiskLevel({
                                 attendance: student.attendance,
                                 average: student.average,
                                 attendanceSamples: 0,
                                 manualStatus: student.status,
                              }),
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
                                 {student.average > 0 ? student.average.toFixed(1) : "Sin datos"}
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
                                            : stats.risk === "low"
                                              ? "bg-success/15 text-success"
                                              : "bg-muted text-muted-foreground"
                                    }`}
                                 >
                                    {stats.risk === "high"
                                       ? "alto"
                                       : stats.risk === "medium"
                                         ? "medio"
                                         : stats.risk === "low"
                                           ? "bajo"
                                           : "sin datos"}
                                 </Badge>
                              </TableCell>
                           </TableRow>
                        );
                     })}

                     {filtered.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={5} className="py-10">
                              <div className="flex flex-col items-center justify-center text-center">
                                 {isInstitutionEmpty ? (
                                    <Users className="size-8 text-muted-foreground/35 mb-2" />
                                 ) : isSearchEmpty ? (
                                    <SearchX className="size-8 text-muted-foreground/35 mb-2" />
                                 ) : (
                                    <FilterX className="size-8 text-muted-foreground/35 mb-2" />
                                 )}

                                 <p className="text-xs font-medium text-foreground">
                                    {isInstitutionEmpty
                                       ? "Aun no hay alumnos para esta institucion."
                                       : isSearchEmpty
                                         ? "No hay alumnos que coincidan con tu busqueda."
                                         : isFilterEmpty
                                           ? "No hay alumnos para el filtro seleccionado."
                                           : "No hay alumnos para mostrar."}
                                 </p>
                                 <p className="mt-1 text-[11px] text-muted-foreground">
                                    {isInstitutionEmpty
                                       ? "Agrega alumnos desde Grupos para comenzar el seguimiento."
                                       : isSearchEmpty
                                         ? "Prueba con otro nombre o limpia la busqueda."
                                         : isFilterEmpty
                                           ? "Prueba con otro filtro de riesgo/estado."
                                           : "Crea datos para poblar esta vista."}
                                 </p>
                              </div>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   );
}


