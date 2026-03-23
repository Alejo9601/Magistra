import { useEffect, useMemo, useState } from "react";
import {
   getAssignmentIdBySubjectId,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import { usePlanningContext } from "@/features/planning";
import { toast } from "sonner";
import { type AttendanceStatus } from "@/features/classroom/types";
import {
   ClassDetailHeader,
   ClassInfoCard,
} from "@/features/classroom/components/class-info-card";
import { ClassNotesCard } from "@/features/classroom/components/class-notes-card";
import { AttendanceCard } from "@/features/classroom/components/attendance-card";
import { Link, useParams } from "react-router-dom";
import { useStudentsContext } from "@/features/students";
import { Button } from "@/components/ui/button";
import { useClassroomContext } from "@/features/classroom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { useActivitiesContext } from "@/features/activities";
import type { ActivityType } from "@/types";

const activityTypeOptions: Array<{ value: ActivityType; label: string }> = [
   { value: "practica", label: "Practica" },
   { value: "examen", label: "Examen" },
   { value: "proyecto", label: "Proyecto" },
   { value: "tarea", label: "Tarea" },
];

export function ClaseDetailContent() {
   const params = useParams();
   const classId = params.id as string;
   const { getStudentsByAssignment } = useStudentsContext();
   const { classes, markClassAsTaught, updateClassNotes } = usePlanningContext();
   const { getRecord, setAttendance: saveAttendance } = useClassroomContext();
   const { getActivitiesByAssignment, toggleActivityLink, addActivity } = useActivitiesContext();

   const cls = classes.find((classSession) => classSession.id === classId);

   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const inst = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];
   const subjectActivities = assignmentId
      ? [...getActivitiesByAssignment(assignmentId)].sort((a, b) =>
           a.title.localeCompare(b.title),
        )
      : [];

   const attendanceFromRecord = useMemo<Record<string, AttendanceStatus>>(() => {
      const record = getRecord(classId);
      const nextAttendance = Object.fromEntries(
         classStudents.map((student) => [
            student.id,
            record.attendance[student.id] ?? ("P" as AttendanceStatus),
         ]),
      );
      return nextAttendance;
   }, [classId, classStudents, getRecord]);
   const [attendance, setAttendance] =
      useState<Record<string, AttendanceStatus>>(attendanceFromRecord);
   const [notesDraftByClassId, setNotesDraftByClassId] = useState<
      Record<string, string>
   >({});

   const [activityTitle, setActivityTitle] = useState("");
   const [activityDescription, setActivityDescription] = useState("");
   const [activityType, setActivityType] = useState<ActivityType>("practica");
   const [activityEvaluable, setActivityEvaluable] = useState(false);
   const [activityRubricId, setActivityRubricId] = useState("");
   const [activityStartDate, setActivityStartDate] = useState("");
   const [activityEndDate, setActivityEndDate] = useState("");

   useEffect(() => {
      setAttendance(attendanceFromRecord);
   }, [attendanceFromRecord]);

   useEffect(() => {
      if (!cls) {
         return;
      }
      setActivityStartDate(cls.date);
   }, [cls]);

   if (!cls || !subject || !inst) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const notes = notesDraftByClassId[cls.id] ?? cls.notes ?? "";

   const handleCreateActivity = () => {
      const title = activityTitle.trim();
      if (!title) {
         toast.error("Escribe un titulo para la actividad.");
         return;
      }
      if (!assignmentId) {
         toast.error("No se encontro el grupo de la clase.");
         return;
      }
      if (!activityStartDate) {
         toast.error("Selecciona la fecha de inicio.");
         return;
      }

      addActivity({
         assignmentId,
         title,
         description: activityDescription,
         type: activityType,
         esEvaluable: activityEvaluable,
         rubricaId: activityEvaluable ? activityRubricId : undefined,
         fechaInicio: activityStartDate,
         fechaFin: activityEndDate || undefined,
         status: "planned",
         linkedClassIds: [cls.id],
      });

      setActivityTitle("");
      setActivityDescription("");
      setActivityType("practica");
      setActivityEvaluable(false);
      setActivityRubricId("");
      setActivityStartDate(cls.date);
      setActivityEndDate("");
      toast.success("Actividad creada y vinculada a la clase.");
   };

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <ClassDetailHeader
            topic={cls.topic}
            subjectName={subject.name}
            course={subject.course}
         />
         <div className="mb-4">
            <Button asChild variant="outline" size="sm" className="text-xs">
               <Link to={`/clase/${cls.id}/dictado`}>Abrir vista de dictado</Link>
            </Button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 flex flex-col gap-4">
               <ClassInfoCard
                  cls={cls}
                  inst={inst}
                  onMarkAsTaught={() => {
                     markClassAsTaught(cls.id);
                     toast.success("Clase registrada como dictada");
                  }}
               />

               <ClassNotesCard
                  notes={notes}
                  onChange={(value) =>
                     setNotesDraftByClassId((prev) => ({ ...prev, [cls.id]: value }))
                  }
                  onSave={() => {
                     updateClassNotes(cls.id, notes);
                     toast.success("Notas guardadas");
                  }}
               />
            </div>

            <div className="lg:col-span-2">
               <div className="flex flex-col gap-4">
                  <AttendanceCard
                     classStudents={classStudents}
                     attendance={attendance}
                     setAttendance={setAttendance}
                     onSave={() => {
                        saveAttendance(cls.id, attendance);
                        toast.success("Asistencia guardada correctamente");
                     }}
                  />
                  <Card>
                     <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">
                           Actividades de la clase
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4 pt-0">
                        {subjectActivities.length === 0 ? (
                           <p className="text-xs text-muted-foreground">
                              No hay actividades creadas para esta materia.
                           </p>
                        ) : (
                           <div className="space-y-2">
                              {subjectActivities.map((activity) => (
                                 <div key={activity.id} className="rounded-md border border-border/60 p-2">
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                       <Checkbox
                                          checked={activity.linkedClassIds.includes(
                                             cls.id,
                                          )}
                                          onCheckedChange={() =>
                                             toggleActivityLink(activity.id, cls.id)
                                          }
                                       />
                                       <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                             <span className="text-xs font-medium text-foreground">
                                                {activity.title}
                                             </span>
                                             <Badge variant="secondary" className="text-[10px] capitalize">
                                                {activity.type}
                                             </Badge>
                                             {activity.esEvaluable ? (
                                                <Badge className="text-[10px] border-0 bg-primary/10 text-primary">
                                                   Evaluable
                                                </Badge>
                                             ) : null}
                                          </div>
                                          {activity.description ? (
                                             <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                {activity.description}
                                             </p>
                                          ) : null}
                                       </div>
                                    </label>
                                 </div>
                              ))}
                           </div>
                        )}

                        <div className="space-y-2 rounded-md border border-dashed border-border/70 p-3">
                           <p className="text-xs font-semibold text-foreground">Agregar actividad</p>
                           <div className="space-y-1.5">
                              <Label className="text-xs">Titulo</Label>
                              <Input
                                 className="h-9 text-xs"
                                 value={activityTitle}
                                 onChange={(event) => setActivityTitle(event.target.value)}
                              />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-xs">Tipo</Label>
                              <Select value={activityType} onValueChange={(value) => setActivityType(value as ActivityType)}>
                                 <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {activityTypeOptions.map((option) => (
                                       <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-xs">Descripcion</Label>
                              <Textarea
                                 className="min-h-[70px] resize-none text-xs"
                                 value={activityDescription}
                                 onChange={(event) => setActivityDescription(event.target.value)}
                              />
                           </div>
                           <label className="flex items-center gap-2 text-xs text-foreground">
                              <Checkbox
                                 checked={activityEvaluable}
                                 onCheckedChange={(checked) => setActivityEvaluable(Boolean(checked))}
                              />
                              Es evaluable
                           </label>
                           {activityEvaluable ? (
                              <div className="space-y-1.5">
                                 <Label className="text-xs">Rubrica (opcional)</Label>
                                 <Input
                                    className="h-9 text-xs"
                                    placeholder="ID de rubrica"
                                    value={activityRubricId}
                                    onChange={(event) => setActivityRubricId(event.target.value)}
                                 />
                              </div>
                           ) : null}
                           <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                 <Label className="text-xs">Fecha inicio</Label>
                                 <Input
                                    className="h-9 text-xs"
                                    type="date"
                                    value={activityStartDate}
                                    onChange={(event) => setActivityStartDate(event.target.value)}
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <Label className="text-xs">Fecha fin</Label>
                                 <Input
                                    className="h-9 text-xs"
                                    type="date"
                                    value={activityEndDate}
                                    onChange={(event) => setActivityEndDate(event.target.value)}
                                 />
                              </div>
                           </div>
                           <Button size="sm" className="w-full text-xs" onClick={handleCreateActivity}>
                              Guardar actividad
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </div>
      </div>
   );
}
