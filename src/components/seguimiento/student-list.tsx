import { useState } from "react";
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
import { getSubjectById } from "@/lib/edu-repository";
import { useStudentsContext } from "@/contexts/students-context";

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
   const [search, setSearch] = useState("");
   const filtered = getStudentsByInstitution(activeInstitution).filter((s) => {
      const matchesSearch = `${s.name} ${s.lastName}`
         .toLowerCase()
         .includes(search.toLowerCase());
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesStatus;
   });

   return (
      <div className="p-6 max-w-7xl mx-auto">
         <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Seguimiento</h1>
            <p className="text-sm text-muted-foreground">
               Perfil y seguimiento de alumnos
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
                        <TableHead className="text-xs">DNI</TableHead>
                        <TableHead className="text-xs">Materias</TableHead>
                        <TableHead className="text-xs">Asistencia</TableHead>
                        <TableHead className="text-xs">Promedio</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filtered.map((student) => (
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
                                 <span className="text-xs font-medium">
                                    {student.lastName}, {student.name}
                                 </span>
                              </div>
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">
                              {student.dni}
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-wrap gap-1">
                                 {student.subjectIds.slice(0, 2).map((sid) => {
                                    const sub = getSubjectById(sid);
                                    return (
                                       <Badge
                                          key={sid}
                                          variant="secondary"
                                          className="text-[10px]"
                                       >
                                          {sub?.name}
                                       </Badge>
                                    );
                                 })}
                                 {student.subjectIds.length > 2 && (
                                    <Badge
                                       variant="secondary"
                                       className="text-[10px]"
                                    >
                                       +{student.subjectIds.length - 2}
                                    </Badge>
                                 )}
                              </div>
                           </TableCell>
                           <TableCell className="text-xs">
                              {student.attendance}%
                           </TableCell>
                           <TableCell className="text-xs font-medium">
                              {student.average.toFixed(1)}
                           </TableCell>
                           <TableCell>
                              <Badge
                                 className={`border-0 text-[10px] ${
                                    student.status === "destacado"
                                       ? "bg-success/10 text-success"
                                       : student.status === "en-riesgo"
                                         ? "bg-destructive/10 text-destructive"
                                         : "bg-muted text-muted-foreground"
                                 }`}
                              >
                                 {student.status === "destacado"
                                    ? "Destacado"
                                    : student.status === "en-riesgo"
                                      ? "En riesgo"
                                      : "Regular"}
                              </Badge>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   );
}
