import { Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { StudentStatusBadge } from "@/features/groups/components/student-status-badge";
import type { Student } from "@/types";

type GroupDetailStudentsTabProps = {
   assignmentId: string;
   groupAttendanceAverage: number;
   atRiskCount: number;
   studentSearch: string;
   onStudentSearchChange: (value: string) => void;
   onAddStudent: () => void;
   filteredStudents: Student[];
   attendanceByStudent: Map<string, number>;
};

export function GroupDetailStudentsTab({
   assignmentId,
   groupAttendanceAverage,
   atRiskCount,
   studentSearch,
   onStudentSearchChange,
   onAddStudent,
   filteredStudents,
   attendanceByStudent,
}: GroupDetailStudentsTabProps) {
   return (
      <TabsContent value="alumnos">
         <div className="mt-2 mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
               Asistencia promedio del grupo: {groupAttendanceAverage}%
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
               En riesgo por asistencia: {atRiskCount}
            </Badge>
         </div>
         <div className="mb-4 mt-2 flex flex-wrap items-center gap-2 sm:justify-between">
            <div className="relative w-full max-w-xs flex-1">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
               <Input
                  className="h-8 pl-8 text-xs"
                  placeholder="Buscar alumno..."
                  value={studentSearch}
                  onChange={(event) => onStudentSearchChange(event.target.value)}
               />
            </div>
            <Button size="sm" className="w-full text-xs sm:w-auto" onClick={onAddStudent}>
               <Plus className="size-3.5 mr-1.5" />
               Agregar Alumno
            </Button>
         </div>
         <Card>
            <CardContent className="p-0">
               <Table className="min-w-[760px]">
                  <TableHeader>
                     <TableRow>
                        <TableHead className="text-xs">Nombre</TableHead>
                        <TableHead className="text-xs">Asistencia %</TableHead>
                        <TableHead className="text-xs">Promedio</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredStudents.map((student) => {
                        const studentAttendance =
                           attendanceByStudent.get(student.id) ?? student.attendance;
                        return (
                           <TableRow key={student.id} className="hover:bg-muted/30 cursor-pointer">
                              <TableCell>
                                 <Link
                                    to={`/seguimiento/${student.id}?assignmentId=${assignmentId}`}
                                    className="flex items-center gap-2.5"
                                 >
                                    <Avatar className="size-7">
                                       <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                                          {student.name[0]}
                                          {student.lastName[0]}
                                       </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-foreground">
                                       {student.lastName}, {student.name}
                                    </span>
                                 </Link>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                       <div
                                          className={`h-full rounded-full ${studentAttendance >= 80 ? "bg-success" : studentAttendance >= 65 ? "bg-warning" : "bg-destructive"}`}
                                          style={{ width: `${studentAttendance}%` }}
                                       />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                       {studentAttendance}%
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                 {student.average.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                 <StudentStatusBadge status={student.status} />
                              </TableCell>
                           </TableRow>
                        );
                     })}
                     {filteredStudents.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={4} className="text-center py-8">
                              <p className="text-xs text-muted-foreground">
                                 No se encontraron alumnos para esa busqueda
                              </p>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </TabsContent>
   );
}
