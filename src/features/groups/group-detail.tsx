import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, BookOpen, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   getAssignmentById,
   getClassesByAssignment,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import { StudentStatusBadge } from "@/features/groups/status-badge";
import { toast } from "sonner";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import {
   useAssessmentsContext,
   type AssessmentStatus,
   type AssessmentType,
} from "@/features/assessments";
import {
   useActivitiesContext,
   type ActivityStatus,
   type ActivityType,
} from "@/features/activities";

const assessmentTypeLabel: Record<AssessmentType, string> = {
   exam: "Examen",
   practice_work: "Trabajo practico",
};

const assessmentStatusLabel: Record<AssessmentStatus, string> = {
   draft: "Borrador",
   scheduled: "Programada",
   published: "Publicada",
   graded: "Corregida",
};

const assessmentStatusBadgeClass: Record<AssessmentStatus, string> = {
   draft: "bg-muted text-muted-foreground",
   scheduled: "bg-primary/10 text-primary",
   published: "bg-info/10 text-info",
   graded: "bg-success/10 text-success",
};

const activityTypeLabel: Record<ActivityType, string> = {
   classwork: "En clase",
   homework: "Tarea",
   lab: "Laboratorio",
   project: "Proyecto",
};

const activityStatusLabel: Record<ActivityStatus, string> = {
   draft: "Borrador",
   planned: "Planificada",
   assigned: "Asignada",
   completed: "Completada",
};

const activityStatusBadgeClass: Record<ActivityStatus, string> = {
   draft: "bg-muted text-muted-foreground",
   planned: "bg-primary/10 text-primary",
   assigned: "bg-info/10 text-info",
   completed: "bg-success/10 text-success",
};

export function GroupDetail({
   assignmentId,
   onBack,
}: {
   assignmentId: string;
   onBack: () => void;
}) {
   const { getStudentsByAssignment, addStudent } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { getAssessmentsByAssignment, addAssessment, removeAssessment } =
      useAssessmentsContext();
   const { getActivitiesByAssignment, addActivity, removeActivity } =
      useActivitiesContext();
   const [addStudentOpen, setAddStudentOpen] = useState(false);
   const [addAssessmentOpen, setAddAssessmentOpen] = useState(false);
   const [addActivityOpen, setAddActivityOpen] = useState(false);
   const [studentSearch, setStudentSearch] = useState("");
   const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>(
      {},
   );
   const [newName, setNewName] = useState("");
   const [newLastName, setNewLastName] = useState("");
   const [newDni, setNewDni] = useState("");
   const [newEmail, setNewEmail] = useState("");
   const [newObservations, setNewObservations] = useState("");
   const [newAssessmentTitle, setNewAssessmentTitle] = useState("");
   const [newAssessmentType, setNewAssessmentType] =
      useState<AssessmentType>("exam");
   const [newAssessmentDate, setNewAssessmentDate] = useState("");
   const [newAssessmentStatus, setNewAssessmentStatus] =
      useState<AssessmentStatus>("draft");
   const [newAssessmentWeight, setNewAssessmentWeight] = useState("1");
   const [newAssessmentMaxScore, setNewAssessmentMaxScore] = useState("10");
   const [newAssessmentDescription, setNewAssessmentDescription] = useState("");
   const [newActivityTitle, setNewActivityTitle] = useState("");
   const [newActivityType, setNewActivityType] = useState<ActivityType>("classwork");
   const [newActivityStatus, setNewActivityStatus] =
      useState<ActivityStatus>("planned");
   const [newActivityDescription, setNewActivityDescription] = useState("");
   const assignment = getAssignmentById(assignmentId);
   const subject = assignment ? getSubjectById(assignment.subjectId) : null;
   const inst = assignment ? getInstitutionById(assignment.institutionId) : null;
   const groupStudents = getStudentsByAssignment(assignmentId);
   const groupClasses = getClassesByAssignment(assignmentId);
   const groupAssessments = useMemo(
      () =>
         [...getAssessmentsByAssignment(assignmentId)].sort((a, b) =>
            a.date.localeCompare(b.date),
         ),
      [assignmentId, getAssessmentsByAssignment],
   );
   const filteredStudents = useMemo(() => {
      const query = studentSearch.trim().toLowerCase();
      if (!query) {
         return groupStudents;
      }
      return groupStudents.filter((student) =>
         `${student.lastName}, ${student.name}`.toLowerCase().includes(query),
      );
   }, [groupStudents, studentSearch]);
   const groupActivities = useMemo(
      () =>
         [...getActivitiesByAssignment(assignmentId)].sort((a, b) =>
            a.title.localeCompare(b.title),
         ),
      [assignmentId, getActivitiesByAssignment],
   );
   const classesByMonth = useMemo(() => {
      const sorted = [...groupClasses].sort((a, b) =>
         `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
      const monthMap = new Map<
         string,
         { key: string; label: string; classes: typeof sorted }
      >();

      sorted.forEach((classSession) => {
         const [year, month] = classSession.date.split("-").slice(0, 2);
         const key = `${year}-${month}`;
         if (!monthMap.has(key)) {
            const date = new Date(`${classSession.date}T12:00:00`);
            monthMap.set(key, {
               key,
               label: date.toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
               }),
               classes: [],
            });
         }
         monthMap.get(key)?.classes.push(classSession);
      });

      return Array.from(monthMap.values());
   }, [groupClasses]);
   const monthKeySignature = useMemo(
      () => classesByMonth.map((monthGroup) => monthGroup.key).join("|"),
      [classesByMonth],
   );
   useEffect(() => {
      setCollapsedMonths((prev) => {
         const next: Record<string, boolean> = {};
         classesByMonth.forEach((monthGroup) => {
            next[monthGroup.key] = prev[monthGroup.key] ?? true;
         });
         return next;
      });
   }, [assignmentId, monthKeySignature, classesByMonth]);
   const isMonthOpen = (monthKey: string) => collapsedMonths[monthKey] ?? true;
   const attendanceByStudent = useMemo(() => {
      const output = new Map<string, number>();
      groupStudents.forEach((student) => {
         const statuses = groupClasses
            .map((classSession) => getRecord(classSession.id).attendance[student.id])
            .filter((status): status is "P" | "A" | "T" | "J" => Boolean(status));

         if (statuses.length === 0) {
            output.set(student.id, student.attendance);
            return;
         }

         const attendedWeight = statuses.reduce((sum, status) => {
            if (status === "P" || status === "J") return sum + 1;
            if (status === "T") return sum + 0.5;
            return sum;
         }, 0);
         output.set(student.id, Math.round((attendedWeight / statuses.length) * 100));
      });
      return output;
   }, [getRecord, groupClasses, groupStudents]);
   const groupAttendanceAverage = useMemo(() => {
      if (groupStudents.length === 0) {
         return 0;
      }
      const total = groupStudents.reduce(
         (sum, student) => sum + (attendanceByStudent.get(student.id) ?? student.attendance),
         0,
      );
      return Math.round(total / groupStudents.length);
   }, [attendanceByStudent, groupStudents]);
   const atRiskCount = useMemo(
      () =>
         groupStudents.filter(
            (student) => (attendanceByStudent.get(student.id) ?? student.attendance) < 65,
         ).length,
      [attendanceByStudent, groupStudents],
   );

   if (!assignment || !subject || !inst) return null;

   const resetStudentForm = () => {
      setNewName("");
      setNewLastName("");
      setNewDni("");
      setNewEmail("");
      setNewObservations("");
   };
   const resetAssessmentForm = () => {
      setNewAssessmentTitle("");
      setNewAssessmentType("exam");
      setNewAssessmentDate("");
      setNewAssessmentStatus("draft");
      setNewAssessmentWeight("1");
      setNewAssessmentMaxScore("10");
      setNewAssessmentDescription("");
   };
   const resetActivityForm = () => {
      setNewActivityTitle("");
      setNewActivityType("classwork");
      setNewActivityStatus("planned");
      setNewActivityDescription("");
   };

   const submitStudent = () => {
      if (!newName.trim() || !newLastName.trim() || !newDni.trim()) {
         toast.error("Completa nombre, apellido y DNI/legajo.");
         return;
      }

      addStudent({
         assignmentId,
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

   const submitAssessment = () => {
      if (!newAssessmentTitle.trim() || !newAssessmentDate) {
         toast.error("Completa titulo y fecha.");
         return;
      }

      const weight = Number(newAssessmentWeight);
      const maxScore = Number(newAssessmentMaxScore);
      if (!Number.isFinite(weight) || weight <= 0) {
         toast.error("La ponderacion debe ser mayor a 0.");
         return;
      }
      if (!Number.isFinite(maxScore) || maxScore <= 0) {
         toast.error("La nota maxima debe ser mayor a 0.");
         return;
      }

      addAssessment({
         assignmentId,
         title: newAssessmentTitle,
         date: newAssessmentDate,
         type: newAssessmentType,
         status: newAssessmentStatus,
         weight,
         maxScore,
         description: newAssessmentDescription,
      });
      setAddAssessmentOpen(false);
      resetAssessmentForm();
      toast.success("Evaluacion creada correctamente");
   };

   const submitActivity = () => {
      if (!newActivityTitle.trim()) {
         toast.error("Completa el titulo de la actividad.");
         return;
      }
      addActivity({
         assignmentId,
         title: newActivityTitle,
         type: newActivityType,
         status: newActivityStatus,
         description: newActivityDescription,
      });
      setAddActivityOpen(false);
      resetActivityForm();
      toast.success("Actividad creada correctamente");
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
                  {inst.name} - {assignment.section}
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
               <TabsTrigger value="actividades" className="text-xs">
                  Actividades
               </TabsTrigger>
            </TabsList>

            <TabsContent value="alumnos">
               <div className="mt-2 mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                     Asistencia promedio del grupo: {groupAttendanceAverage}%
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                     En riesgo por asistencia: {atRiskCount}
                  </Badge>
               </div>
               <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="relative max-w-xs flex-1">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                     <Input
                        className="h-8 pl-8 text-xs"
                        placeholder="Buscar alumno..."
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
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
                           {filteredStudents.map((student) => {
                              const studentAttendance =
                                 attendanceByStudent.get(student.id) ??
                                 student.attendance;
                              return (
                                 <TableRow
                                    key={student.id}
                                    className="hover:bg-muted/30 cursor-pointer"
                                 >
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
                                                style={{
                                                   width: `${studentAttendance}%`,
                                                }}
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
                                 <TableCell
                                    colSpan={4}
                                    className="text-center py-8"
                                 >
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

            <TabsContent value="planificacion">
               {classesByMonth.length === 0 ? (
                  <Card className="mt-2">
                     <CardContent className="py-8 text-center">
                        <p className="text-xs text-muted-foreground">
                           No hay clases planificadas para este grupo.
                        </p>
                     </CardContent>
                  </Card>
               ) : (
                  <div className="mt-2 space-y-3">
                     {classesByMonth.map((monthGroup) => (
                        <Card
                           key={monthGroup.key}
                           className="overflow-hidden border-border/70 py-2 gap-2"
                        >
                           <Collapsible
                              open={isMonthOpen(monthGroup.key)}
                              onOpenChange={(open) =>
                                 setCollapsedMonths((prev) => ({
                                    ...prev,
                                    [monthGroup.key]: open,
                                 }))
                              }
                           >
                              <CollapsibleTrigger asChild>
                                 <button
                                    type="button"
                                    className={`group flex w-full items-center justify-between px-3.5 py-2 text-left transition-colors ${
                                       isMonthOpen(monthGroup.key)
                                          ? "bg-muted/30 border-b border-border/70"
                                          : "bg-card hover:bg-muted/20"
                                    }`}
                                 >
                                    <div className="flex items-center gap-2.5">
                                       <ChevronRight
                                          className={`size-4 text-muted-foreground transition-transform duration-200 ${
                                             isMonthOpen(monthGroup.key)
                                                ? "rotate-90 text-foreground"
                                                : ""
                                          }`}
                                       />
                                       <p className="text-xs font-semibold text-foreground capitalize tracking-wide">
                                          {monthGroup.label}
                                       </p>
                                    </div>
                                    <Badge
                                       variant="secondary"
                                       className="text-[10px] rounded-full px-2.5 bg-primary/10 text-primary"
                                    >
                                       {monthGroup.classes.length} clases
                                    </Badge>
                                 </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                 <CardContent className="p-0.5 bg-background">
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
                                          {monthGroup.classes.map((cls) => {
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
                              </CollapsibleContent>
                           </Collapsible>
                        </Card>
                     ))}
                  </div>
               )}
            </TabsContent>

            <TabsContent value="evaluaciones">
               <div className="mt-2 mb-3 flex items-center justify-end">
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={() => setAddAssessmentOpen(true)}
                  >
                     <Plus className="size-3.5 mr-1.5" />
                     Crear evaluacion o TP
                  </Button>
               </div>
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
                              <TableHead className="text-xs">Estado</TableHead>
                              <TableHead className="text-xs">
                                 Notas cargadas
                              </TableHead>
                              <TableHead className="text-xs text-right">
                                 Acciones
                              </TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {groupAssessments.map((assessment) => {
                              const dateObj = new Date(
                                 assessment.date + "T12:00:00",
                              );
                              return (
                                 <TableRow
                                    key={assessment.id}
                                    className="hover:bg-muted/30"
                                 >
                                    <TableCell className="text-xs font-medium">
                                       {assessment.title}
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
                                          {assessmentTypeLabel[assessment.type]}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       <Badge
                                          className={`border-0 text-[10px] ${assessmentStatusBadgeClass[assessment.status]}`}
                                       >
                                          {assessmentStatusLabel[assessment.status]}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       <span className="text-xs text-muted-foreground">
                                          {assessment.gradesLoaded} /{" "}
                                          {groupStudents.length}
                                       </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="size-7"
                                          onClick={() => {
                                             removeAssessment(assessment.id);
                                             toast.success("Evaluacion eliminada");
                                          }}
                                       >
                                          <Trash2 className="size-3.5 text-muted-foreground" />
                                       </Button>
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
                           {groupAssessments.length === 0 && (
                              <TableRow>
                                 <TableCell
                                    colSpan={6}
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
                                       onClick={() => setAddAssessmentOpen(true)}
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

            <TabsContent value="actividades">
               <div className="mt-2 mb-3 flex items-center justify-end">
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={() => setAddActivityOpen(true)}
                  >
                     <Plus className="size-3.5 mr-1.5" />
                     Crear actividad
                  </Button>
               </div>
               <Card className="mt-2">
                  <CardContent className="p-0">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs">Actividad</TableHead>
                              <TableHead className="text-xs">Tipo</TableHead>
                              <TableHead className="text-xs">Estado</TableHead>
                              <TableHead className="text-xs">
                                 Clases vinculadas
                              </TableHead>
                              <TableHead className="text-xs text-right">
                                 Acciones
                              </TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {groupActivities.map((activity) => (
                              <TableRow key={activity.id} className="hover:bg-muted/30">
                                 <TableCell className="text-xs font-medium">
                                    <div>
                                       <p>{activity.title}</p>
                                       {activity.description && (
                                          <p className="text-[11px] text-muted-foreground mt-1">
                                             {activity.description}
                                          </p>
                                       )}
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <Badge
                                       variant="secondary"
                                       className="text-[10px] capitalize"
                                    >
                                       {activityTypeLabel[activity.type]}
                                    </Badge>
                                 </TableCell>
                                 <TableCell>
                                    <Badge
                                       className={`border-0 text-[10px] ${activityStatusBadgeClass[activity.status]}`}
                                    >
                                       {activityStatusLabel[activity.status]}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-xs text-muted-foreground">
                                    {activity.linkedClassIds.length}
                                 </TableCell>
                                 <TableCell className="text-right">
                                    <Button
                                       type="button"
                                       variant="ghost"
                                       size="icon"
                                       className="size-7"
                                       onClick={() => {
                                          removeActivity(activity.id);
                                          toast.success("Actividad eliminada");
                                       }}
                                    >
                                       <Trash2 className="size-3.5 text-muted-foreground" />
                                    </Button>
                                 </TableCell>
                              </TableRow>
                           ))}
                           {groupActivities.length === 0 && (
                              <TableRow>
                                 <TableCell
                                    colSpan={5}
                                    className="text-center py-8"
                                 >
                                    <BookOpen className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                       No hay actividades registradas
                                    </p>
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       className="mt-3 text-xs"
                                       onClick={() => setAddActivityOpen(true)}
                                    >
                                       <Plus className="size-3.5 mr-1.5" />
                                       Crear actividad
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
                     {assignment.section}.
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

         <Dialog
            open={addAssessmentOpen}
            onOpenChange={(open) => {
               setAddAssessmentOpen(open);
               if (!open) {
                  resetAssessmentForm();
               }
            }}
         >
            <DialogContent className="sm:max-w-[520px]">
               <DialogHeader>
                  <DialogTitle>Nueva evaluacion</DialogTitle>
                  <DialogDescription>
                     Crea una instancia evaluativa para {subject.name} -{" "}
                     {assignment.section}.
                  </DialogDescription>
               </DialogHeader>
               <div className="grid grid-cols-1 gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Titulo</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Ej: Parcial 1 - Algebra"
                        value={newAssessmentTitle}
                        onChange={(event) =>
                           setNewAssessmentTitle(event.target.value)
                        }
                     />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                           value={newAssessmentType}
                           onValueChange={(value) =>
                              setNewAssessmentType(value as AssessmentType)
                           }
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="exam">Examen</SelectItem>
                              <SelectItem value="practice_work">
                                 Trabajo practico
                              </SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Fecha</Label>
                        <Input
                           className="h-9 text-xs"
                           type="date"
                           value={newAssessmentDate}
                           onChange={(event) =>
                              setNewAssessmentDate(event.target.value)
                           }
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Estado</Label>
                        <Select
                           value={newAssessmentStatus}
                           onValueChange={(value) =>
                              setNewAssessmentStatus(value as AssessmentStatus)
                           }
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="draft">Borrador</SelectItem>
                              <SelectItem value="scheduled">Programada</SelectItem>
                              <SelectItem value="published">Publicada</SelectItem>
                              <SelectItem value="graded">Corregida</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Ponderacion</Label>
                        <Input
                           className="h-9 text-xs"
                           type="number"
                           min="0.1"
                           step="0.1"
                           value={newAssessmentWeight}
                           onChange={(event) =>
                              setNewAssessmentWeight(event.target.value)
                           }
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nota maxima</Label>
                        <Input
                           className="h-9 text-xs"
                           type="number"
                           min="1"
                           step="1"
                           value={newAssessmentMaxScore}
                           onChange={(event) =>
                              setNewAssessmentMaxScore(event.target.value)
                           }
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Descripcion (opcional)</Label>
                     <Textarea
                        className="text-xs min-h-[80px] resize-none"
                        placeholder="Criterios, consigna, alcance..."
                        value={newAssessmentDescription}
                        onChange={(event) =>
                           setNewAssessmentDescription(event.target.value)
                        }
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setAddAssessmentOpen(false)}
                     className="text-xs"
                  >
                     Cancelar
                  </Button>
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={submitAssessment}
                  >
                     Guardar
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <Dialog
            open={addActivityOpen}
            onOpenChange={(open) => {
               setAddActivityOpen(open);
               if (!open) {
                  resetActivityForm();
               }
            }}
         >
            <DialogContent className="sm:max-w-[520px]">
               <DialogHeader>
                  <DialogTitle>Nueva actividad</DialogTitle>
                  <DialogDescription>
                     Crea una actividad para {subject.name} - {assignment.section}.
                  </DialogDescription>
               </DialogHeader>
               <div className="grid grid-cols-1 gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Titulo</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Ej: Guia de ejercicios de funciones"
                        value={newActivityTitle}
                        onChange={(event) => setNewActivityTitle(event.target.value)}
                     />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                           value={newActivityType}
                           onValueChange={(value) =>
                              setNewActivityType(value as ActivityType)
                           }
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="classwork">En clase</SelectItem>
                              <SelectItem value="homework">Tarea</SelectItem>
                              <SelectItem value="lab">Laboratorio</SelectItem>
                              <SelectItem value="project">Proyecto</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Estado</Label>
                        <Select
                           value={newActivityStatus}
                           onValueChange={(value) =>
                              setNewActivityStatus(value as ActivityStatus)
                           }
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="draft">Borrador</SelectItem>
                              <SelectItem value="planned">Planificada</SelectItem>
                              <SelectItem value="assigned">Asignada</SelectItem>
                              <SelectItem value="completed">Completada</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Descripcion (opcional)</Label>
                     <Textarea
                        className="text-xs min-h-[80px] resize-none"
                        placeholder="Objetivos, consigna y criterios..."
                        value={newActivityDescription}
                        onChange={(event) =>
                           setNewActivityDescription(event.target.value)
                        }
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setAddActivityOpen(false)}
                     className="text-xs"
                  >
                     Cancelar
                  </Button>
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={submitActivity}
                  >
                     Guardar
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}





