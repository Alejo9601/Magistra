import { useMemo, useState } from "react";
import {
   Calendar,
   Star,
   FileText,
   Plus,
   ArrowLeft,
   MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   evaluations,
   getSubjectById,
   getInstitutionById,
} from "@/lib/edu-repository";
import { toast } from "sonner";
import { useStudentsContext } from "@/features/students";
import { usePlanningContext } from "@/features/planning";
import { useClassroomContext } from "@/features/classroom";

export function StudentProfile({
   studentId,
   onBack,
   activeInstitution,
}: {
   studentId: string;
   onBack: () => void;
   activeInstitution: string;
}) {
   const { students } = useStudentsContext();
   const { classes } = usePlanningContext();
   const { getRecord } = useClassroomContext();
   const [gradeModalOpen, setGradeModalOpen] = useState(false);
   const student = students.find((s) => s.id === studentId);

   if (!student) return null;

   const studentSubjects = student.subjectIds
      .map((sid) => getSubjectById(sid))
      .filter((subject) => Boolean(subject))
      .filter((subject) => subject?.institutionId === activeInstitution);
   const firstSubject =
      studentSubjects[0] || getSubjectById(student.subjectIds[0]);
   const inst = firstSubject
      ? getInstitutionById(firstSubject.institutionId)
      : null;
   const studentEvals = evaluations.filter((e) =>
      e.grades.some((g) => g.studentId === studentId),
   );
   const attendanceEntries = useMemo(() => {
      const subjectIdSet = new Set(student.subjectIds);
      const relevantClasses = classes.filter(
         (classSession) =>
            subjectIdSet.has(classSession.subjectId) &&
            classSession.institutionId === activeInstitution,
      );
      return relevantClasses
         .map((classSession) => ({
            classId: classSession.id,
            date: classSession.date,
            status: getRecord(classSession.id).attendance[studentId],
         }))
         .filter(
            (entry): entry is { classId: string; date: string; status: "P" | "A" | "T" | "J" } =>
               Boolean(entry.status),
         );
   }, [activeInstitution, classes, getRecord, student.subjectIds, studentId]);

   const attendancePct = useMemo(() => {
      if (attendanceEntries.length === 0) {
         return student.attendance;
      }
      const attendedWeight = attendanceEntries.reduce((sum, entry) => {
         if (entry.status === "P" || entry.status === "J") return sum + 1;
         if (entry.status === "T") return sum + 0.5;
         return sum;
      }, 0);
      return Math.round((attendedWeight / attendanceEntries.length) * 100);
   }, [attendanceEntries, student.attendance]);

   const attendanceByDate = useMemo(() => {
      const grouped = new Map<string, Array<"P" | "A" | "T" | "J">>();
      attendanceEntries.forEach((entry) => {
         const list = grouped.get(entry.date) ?? [];
         list.push(entry.status);
         grouped.set(entry.date, list);
      });

      return new Map(
         Array.from(grouped.entries()).map(([date, statuses]) => {
            let aggregated: "present" | "absent" | "late" | "justified";
            if (statuses.includes("A")) {
               aggregated = "absent";
            } else if (statuses.includes("T")) {
               aggregated = "late";
            } else if (statuses.includes("J")) {
               aggregated = "justified";
            } else {
               aggregated = "present";
            }
            return [date, aggregated] as const;
         }),
      );
   }, [attendanceEntries]);

   const calendarDays = useMemo(() => {
      const today = new Date();
      return Array.from({ length: 28 }, (_, index) => {
         const date = new Date(today);
         date.setDate(today.getDate() - (27 - index));
         const yyyy = date.getFullYear();
         const mm = String(date.getMonth() + 1).padStart(2, "0");
         const dd = String(date.getDate()).padStart(2, "0");
         const dateStr = `${yyyy}-${mm}-${dd}`;
         return {
            date: dateStr,
            day: date.getDate(),
            status: attendanceByDate.get(dateStr) ?? "none",
         };
      });
   }, [attendanceByDate]);
   const calendarOffset = useMemo(() => {
      if (calendarDays.length === 0) {
         return 0;
      }
      const firstDate = new Date(`${calendarDays[0].date}T12:00:00`);
      const jsDay = firstDate.getDay();
      return (jsDay + 6) % 7;
   }, [calendarDays]);

   const observations = [
      {
         date: "2026-02-25",
         text: "Presento dificultades con factorizacion de polinomios. Se le asigno practica extra.",
      },
      {
         date: "2026-02-18",
         text: "Muy buena participacion en clase. Ayudo a companieros con ejercicios.",
      },
      {
         date: "2026-02-10",
         text: "Entrego TP fuera de termino. Solicitar justificacion.",
      },
   ];

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
            <div className="flex items-center gap-3">
               <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                     {student.name[0]}
                     {student.lastName[0]}
                  </AvatarFallback>
               </Avatar>
               <div>
                  <h1 className="text-xl font-bold text-foreground">
                     {student.name} {student.lastName}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                     {inst?.name} - {firstSubject?.name} -{" "}
                     {firstSubject?.course}
                  </p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
               <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                     <Calendar className="size-5 text-primary" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Asistencia
                     </p>
                     <p
                        className={`text-2xl font-bold ${attendancePct >= 80 ? "text-success" : attendancePct >= 65 ? "text-warning-foreground" : "text-destructive"}`}
                     >
                        {attendancePct}%
                     </p>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
                     <Star className="size-5 text-warning-foreground" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Promedio General
                     </p>
                     <p className="text-2xl font-bold text-foreground">
                        {student.average.toFixed(1)}
                     </p>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-info/10">
                     <FileText className="size-5 text-info" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Trabajos entregados
                     </p>
                     <p className="text-2xl font-bold text-foreground">
                        {studentEvals.length} /{" "}
                        {
                           evaluations.filter((e) =>
                              student.subjectIds.includes(e.subjectId),
                           ).length
                        }
                     </p>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Historial de asistencias (ultimos 28 dias)
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <div className="grid grid-cols-7 gap-1.5">
                        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                           <div
                              key={d}
                              className="text-center text-[10px] font-medium text-muted-foreground pb-1"
                           >
                              {d}
                           </div>
                        ))}
                        {Array.from({ length: calendarOffset }).map((_, i) => (
                           <div key={`empty-${i}`} />
                        ))}
                        {calendarDays.map((d) => (
                           <div
                              key={d.date}
                              className={`flex items-center justify-center size-8 rounded-md text-[10px] font-medium ${
                                 d.status === "present"
                                    ? "bg-success/15 text-success"
                                    : d.status === "absent"
                                      ? "bg-destructive/15 text-destructive"
                                      : d.status === "late"
                                        ? "bg-warning/15 text-warning-foreground"
                                        : d.status === "justified"
                                          ? "bg-info/15 text-info"
                                        : "bg-muted text-muted-foreground"
                              }`}
                           >
                              {d.day}
                           </div>
                        ))}
                     </div>
                     <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5">
                           <div className="size-2.5 rounded bg-success/40" />
                           <span className="text-[10px] text-muted-foreground">
                              Presente
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className="size-2.5 rounded bg-destructive/40" />
                           <span className="text-[10px] text-muted-foreground">
                              Ausente
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className="size-2.5 rounded bg-warning/40" />
                           <span className="text-[10px] text-muted-foreground">
                              Tarde
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className="size-2.5 rounded bg-info/40" />
                           <span className="text-[10px] text-muted-foreground">
                              Justificada
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className="size-2.5 rounded bg-muted" />
                           <span className="text-[10px] text-muted-foreground">
                              Sin clase
                           </span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                           Evaluaciones y TPs
                        </CardTitle>
                        <Button
                           variant="outline"
                           size="sm"
                           className="text-xs"
                           onClick={() => setGradeModalOpen(true)}
                        >
                           <Plus className="size-3.5 mr-1.5" />
                           Cargar Nota
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs">Fecha</TableHead>
                              <TableHead className="text-xs">
                                 Evaluacion
                              </TableHead>
                              <TableHead className="text-xs">Tipo</TableHead>
                              <TableHead className="text-xs">Nota</TableHead>
                              <TableHead className="text-xs">
                                 Observacion
                              </TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {studentEvals.map((ev) => {
                              const grade = ev.grades.find(
                                 (g) => g.studentId === studentId,
                              );
                              const dateObj = new Date(ev.date + "T12:00:00");
                              return (
                                 <TableRow key={ev.id}>
                                    <TableCell className="text-xs">
                                       {dateObj.toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "short",
                                       })}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium">
                                       {ev.name}
                                    </TableCell>
                                    <TableCell>
                                       <Badge
                                          variant="secondary"
                                          className="text-[10px] capitalize"
                                       >
                                          {ev.type}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold">
                                       {grade?.grade ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                       {grade?.observation || "-"}
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
                           {studentEvals.length === 0 && (
                              <TableRow>
                                 <TableCell
                                    colSpan={5}
                                    className="text-center py-6"
                                 >
                                    <p className="text-xs text-muted-foreground">
                                       No hay evaluaciones con notas cargadas
                                    </p>
                                 </TableCell>
                              </TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </div>

            <div>
               <Card>
                  <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                           Observaciones
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="size-7">
                           <Plus className="size-3.5" />
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <div className="flex flex-col gap-0">
                        {observations.map((obs, idx) => {
                           const dateObj = new Date(obs.date + "T12:00:00");
                           return (
                              <div
                                 key={idx}
                                 className="relative flex gap-3 pb-4 last:pb-0"
                              >
                                 {idx < observations.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                                 )}
                                 <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <MessageSquare className="size-3 text-muted-foreground" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground mb-1">
                                       {dateObj.toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                       })}
                                    </p>
                                    <p className="text-xs text-foreground leading-relaxed">
                                       {obs.text}
                                    </p>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>

         <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
            <DialogContent className="sm:max-w-[420px]">
               <DialogHeader>
                  <DialogTitle>Cargar Nota</DialogTitle>
                  <DialogDescription>
                     Registra una calificacion para {student.name}{" "}
                     {student.lastName}.
                  </DialogDescription>
               </DialogHeader>
               <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Evaluacion</Label>
                     <Select>
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue placeholder="Seleccionar evaluacion..." />
                        </SelectTrigger>
                        <SelectContent>
                           {evaluations
                              .filter((e) =>
                                 student.subjectIds.includes(e.subjectId),
                              )
                              .map((e) => (
                                 <SelectItem key={e.id} value={e.id}>
                                    {e.name}
                                 </SelectItem>
                              ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Nota</Label>
                     <Input
                        className="h-9 text-xs"
                        type="number"
                        min="1"
                        max="10"
                        placeholder="1 - 10"
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Observacion</Label>
                     <Textarea
                        className="text-xs min-h-[60px] resize-none"
                        placeholder="Observacion opcional..."
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setGradeModalOpen(false)}
                     className="text-xs"
                  >
                     Cancelar
                  </Button>
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={() => {
                        setGradeModalOpen(false);
                        toast.success("Nota guardada correctamente");
                     }}
                  >
                     Guardar
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}



