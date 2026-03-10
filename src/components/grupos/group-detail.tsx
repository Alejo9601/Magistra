import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   subjects,
   getInstitutionById,
   getClassesBySubject,
   getEvaluationsBySubject,
} from "@/lib/edu-repository";
import { StudentStatusBadge } from "@/components/grupos/status-badge";
import { toast } from "sonner";
import { useStudentsContext } from "@/contexts/students-context";

export function GroupDetail({
   subjectId,
   onBack,
}: {
   subjectId: string;
   onBack: () => void;
}) {
   const { getStudentsBySubject, addStudent } = useStudentsContext();
   const [addStudentOpen, setAddStudentOpen] = useState(false);
   const [newName, setNewName] = useState("");
   const [newLastName, setNewLastName] = useState("");
   const [newDni, setNewDni] = useState("");
   const [newEmail, setNewEmail] = useState("");
   const [newObservations, setNewObservations] = useState("");
   const subject = subjects.find((s) => s.id === subjectId);
   const inst = subject ? getInstitutionById(subject.institutionId) : null;
   const groupStudents = getStudentsBySubject(subjectId);
   const groupClasses = getClassesBySubject(subjectId);
   const groupEvals = getEvaluationsBySubject(subjectId);

   if (!subject || !inst) return null;

   const resetStudentForm = () => {
      setNewName("");
      setNewLastName("");
      setNewDni("");
      setNewEmail("");
      setNewObservations("");
   };

   const submitStudent = () => {
      if (!newName.trim() || !newLastName.trim() || !newDni.trim()) {
         toast.error("Completa nombre, apellido y DNI/legajo.");
         return;
      }

      addStudent({
         subjectId,
         name: newName,
         lastName: newLastName,
         dni: newDni,
         email: newEmail,
         observations: newObservations,
      });
      setAddStudentOpen(false);
      resetStudentForm();
      toast.success("Alumno agregado correctamente");
   };

   return (
      <div className="p-6 max-w-7xl mx-auto">
         <div className="flex items-center gap-3 mb-6">
            <Button
               variant="ghost"
               size="icon"
               className="size-8"
               onClick={onBack}
            >
               <ArrowLeft className="size-4" />
            </Button>
            <div>
               <h1 className="text-xl font-bold text-foreground">
                  {subject.name}
               </h1>
               <p className="text-sm text-muted-foreground">
                  {inst.name} - {subject.course}
               </p>
            </div>
         </div>

         <Tabs defaultValue="alumnos">
            <TabsList>
               <TabsTrigger value="alumnos" className="text-xs">
                  Alumnos
               </TabsTrigger>
               <TabsTrigger value="planificacion" className="text-xs">
                  Planificacion
               </TabsTrigger>
               <TabsTrigger value="evaluaciones" className="text-xs">
                  Evaluaciones
               </TabsTrigger>
            </TabsList>

            <TabsContent value="alumnos">
               <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="relative max-w-xs flex-1">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                     <Input
                        className="h-8 pl-8 text-xs"
                        placeholder="Buscar alumno..."
                     />
                  </div>
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={() => setAddStudentOpen(true)}
                  >
                     <Plus className="size-3.5 mr-1.5" />
                     Agregar Alumno
                  </Button>
               </div>
               <Card>
                  <CardContent className="p-0">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs">Nombre</TableHead>
                              <TableHead className="text-xs">
                                 Asistencia %
                              </TableHead>
                              <TableHead className="text-xs">
                                 Promedio
                              </TableHead>
                              <TableHead className="text-xs">Estado</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {groupStudents.map((student) => (
                              <TableRow
                                 key={student.id}
                                 className="hover:bg-muted/30 cursor-pointer"
                              >
                                 <TableCell>
                                    <Link
                                       to={`/seguimiento/${student.id}`}
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
                                             className={`h-full rounded-full ${student.attendance >= 80 ? "bg-success" : student.attendance >= 65 ? "bg-warning" : "bg-destructive"}`}
                                             style={{
                                                width: `${student.attendance}%`,
                                             }}
                                          />
                                       </div>
                                       <span className="text-xs text-muted-foreground">
                                          {student.attendance}%
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
                           ))}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="planificacion">
               <Card className="mt-2">
                  <CardContent className="p-0">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs">Fecha</TableHead>
                              <TableHead className="text-xs">Tema</TableHead>
                              <TableHead className="text-xs">Tipo</TableHead>
                              <TableHead className="text-xs">Estado</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {groupClasses.map((cls) => {
                              const dateObj = new Date(cls.date + "T12:00:00");
                              return (
                                 <TableRow
                                    key={cls.id}
                                    className="hover:bg-muted/30"
                                 >
                                    <TableCell className="text-xs">
                                       {dateObj.toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "short",
                                       })}{" "}
                                       {cls.time}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium">
                                       {cls.topic}
                                    </TableCell>
                                    <TableCell>
                                       <Badge
                                          variant="secondary"
                                          className="text-[10px] capitalize"
                                       >
                                          {cls.type}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       <Badge
                                          className={`border-0 text-[10px] ${
                                             cls.status === "planificada"
                                                ? "bg-primary/10 text-primary"
                                                : cls.status === "finalizada"
                                                  ? "bg-success/10 text-success"
                                                  : "bg-warning/10 text-warning-foreground"
                                          }`}
                                       >
                                          {cls.status === "planificada"
                                             ? "Planificada"
                                             : cls.status === "finalizada"
                                               ? "Finalizada"
                                               : "Sin planificar"}
                                       </Badge>
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="evaluaciones">
               <Card className="mt-2">
                  <CardContent className="p-0">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs">
                                 Evaluacion
                              </TableHead>
                              <TableHead className="text-xs">Fecha</TableHead>
                              <TableHead className="text-xs">Tipo</TableHead>
                              <TableHead className="text-xs">
                                 Notas cargadas
                              </TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {groupEvals.map((ev) => {
                              const dateObj = new Date(ev.date + "T12:00:00");
                              return (
                                 <TableRow
                                    key={ev.id}
                                    className="hover:bg-muted/30"
                                 >
                                    <TableCell className="text-xs font-medium">
                                       {ev.name}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                       {dateObj.toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "short",
                                       })}
                                    </TableCell>
                                    <TableCell>
                                       <Badge
                                          variant="secondary"
                                          className="text-[10px] capitalize"
                                       >
                                          {ev.type}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       <span className="text-xs text-muted-foreground">
                                          {ev.grades.length} /{" "}
                                          {groupStudents.length}
                                       </span>
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
                           {groupEvals.length === 0 && (
                              <TableRow>
                                 <TableCell
                                    colSpan={4}
                                    className="text-center py-8"
                                 >
                                    <BookOpen className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                       No hay evaluaciones registradas
                                    </p>
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       className="mt-3 text-xs"
                                    >
                                       <Plus className="size-3.5 mr-1.5" />
                                       Crear evaluacion
                                    </Button>
                                 </TableCell>
                              </TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </TabsContent>
         </Tabs>

         <Dialog
            open={addStudentOpen}
            onOpenChange={(open) => {
               setAddStudentOpen(open);
               if (!open) {
                  resetStudentForm();
               }
            }}
         >
            <DialogContent className="sm:max-w-[420px]">
               <DialogHeader>
                  <DialogTitle>Agregar Alumno</DialogTitle>
                  <DialogDescription>
                     Agrega un nuevo alumno al grupo {subject.name} -{" "}
                     {subject.course}.
                  </DialogDescription>
               </DialogHeader>
               <div className="flex flex-col gap-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nombre</Label>
                        <Input
                           className="h-9 text-xs"
                           placeholder="Nombre"
                           value={newName}
                           onChange={(event) => setNewName(event.target.value)}
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Apellido</Label>
                        <Input
                           className="h-9 text-xs"
                           placeholder="Apellido"
                           value={newLastName}
                           onChange={(event) => setNewLastName(event.target.value)}
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">DNI / Legajo</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Ej: 45123678"
                        value={newDni}
                        onChange={(event) => setNewDni(event.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Email (opcional)</Label>
                     <Input
                        className="h-9 text-xs"
                        type="email"
                        placeholder="alumno@email.com"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Observaciones iniciales</Label>
                     <Textarea
                        className="text-xs min-h-[60px] resize-none"
                        placeholder="Notas sobre el alumno..."
                        value={newObservations}
                        onChange={(event) => setNewObservations(event.target.value)}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setAddStudentOpen(false)}
                     className="text-xs"
                  >
                     Cancelar
                  </Button>
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={submitStudent}
                  >
                     Agregar
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}
