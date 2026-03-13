import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
   getAssignmentIdBySubjectId,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useActivitiesContext } from "@/features/activities";
import { AttendanceCard } from "@/features/classroom/attendance-card";
import { type AttendanceStatus } from "@/features/classroom/constants";

function parseActivityChecklist(activities?: string) {
   if (!activities) {
      return [];
   }
   const parts = activities
      .split(/\r?\n|[.;]/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
   return Array.from(new Set(parts));
}

export function ClaseDictadoContent() {
   const params = useParams();
   const classId = params.id as string;
   const { classes, markClassAsTaught, updateClass } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const { getRecord, toggleSubtopic, toggleActivity, setAttendance, setNotes } =
      useClassroomContext();
   const { getActivitiesByAssignment, addActivity } = useActivitiesContext();

   const [addingSubtopic, setAddingSubtopic] = useState(false);
   const [newSubtopic, setNewSubtopic] = useState("");
   const [addingActivity, setAddingActivity] = useState(false);
   const [newActivity, setNewActivity] = useState("");

   const cls = classes.find((classSession) => classSession.id === classId);
   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const institution = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];

   if (!cls || !subject || !institution) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const record = getRecord(cls.id);
   const subjectActivities = getActivitiesByAssignment(assignmentId);
   const linkedActivityTitles = subjectActivities
      .filter((activity) => activity.linkedClassIds.includes(cls.id))
      .map((activity) => activity.title);
   const activityChecklist = Array.from(
      new Set([...parseActivityChecklist(cls.activities), ...linkedActivityTitles]),
   );
   const attendanceWithDefaults: Record<string, AttendanceStatus> = Object.fromEntries(
      classStudents.map((student) => [
         student.id,
         record.attendance[student.id] ?? ("P" as AttendanceStatus),
      ]),
   );
   const completedSubtopicsCount = cls.subtopics.filter((subtopic) =>
      record.completedSubtopics.includes(subtopic),
   ).length;
   const completedActivitiesCount = activityChecklist.filter((activity) =>
      record.completedActivities.includes(activity),
   ).length;

   const handleAddSubtopic = () => {
      const value = newSubtopic.trim();
      if (!value) {
         toast.error("Escribe un subtema valido.");
         return;
      }
      if (cls.subtopics.some((subtopic) => subtopic.toLowerCase() === value.toLowerCase())) {
         toast.error("Ese subtema ya existe.");
         return;
      }
      updateClass(cls.id, {
         subtopics: [...cls.subtopics, value],
      });
      setNewSubtopic("");
      setAddingSubtopic(false);
      toast.success("Subtema agregado.");
   };

   const handleAddActivity = () => {
      const value = newActivity.trim();
      if (!value) {
         toast.error("Escribe una actividad valida.");
         return;
      }
      if (activityChecklist.some((activity) => activity.toLowerCase() === value.toLowerCase())) {
         toast.error("Esa actividad ya existe en la clase.");
         return;
      }
      addActivity({
         assignmentId,
         title: value,
         type: "classwork",
         status: "planned",
         linkedClassIds: [cls.id],
      });
      setNewActivity("");
      setAddingActivity(false);
      toast.success("Actividad agregada y vinculada a la clase.");
   };

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link to={`/clase/${cls.id}`}>
                     <ArrowLeft className="size-4" />
                  </Link>
               </Button>
               <div>
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                     <ClipboardCheck className="size-5 text-primary" />
                     Vista de Dictado
                  </h1>
                  <p className="text-sm text-muted-foreground">
                     {subject.name} - {subject.course} - {cls.date} {cls.time} hs
                  </p>
               </div>
            </div>
            <Button
               size="sm"
               className="text-xs"
               onClick={() => {
                  setAttendance(cls.id, attendanceWithDefaults);
                  markClassAsTaught(cls.id);
                  toast.success("Clase finalizada y asistencia registrada.");
               }}
            >
               <CheckCircle2 className="size-3.5 mr-1.5" />
               Cerrar clase de hoy
            </Button>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 space-y-6">
               <Card>
                  <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                           Subtemas dictados
                        </CardTitle>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="text-[10px]">
                              {completedSubtopicsCount}/{cls.subtopics.length}
                           </Badge>
                           <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => setAddingSubtopic((prev) => !prev)}
                              title="Agregar subtema"
                           >
                              {addingSubtopic ? (
                                 <X className="size-3.5" />
                              ) : (
                                 <Plus className="size-3.5" />
                              )}
                           </Button>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                     {addingSubtopic && (
                        <div className="mb-3 flex gap-2">
                           <Input
                              className="h-8 text-xs"
                              placeholder="Nuevo subtema..."
                              value={newSubtopic}
                              onChange={(event) => setNewSubtopic(event.target.value)}
                           />
                           <Button size="sm" className="h-8 text-xs" onClick={handleAddSubtopic}>
                              Agregar
                           </Button>
                        </div>
                     )}
                     {cls.subtopics.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                           Esta clase no tiene subtemas cargados.
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {cls.subtopics.map((subtopic) => (
                              <label
                                 key={subtopic}
                                 className="flex items-start gap-2.5 cursor-pointer"
                              >
                                 <Checkbox
                                    checked={record.completedSubtopics.includes(subtopic)}
                                    onCheckedChange={() =>
                                       toggleSubtopic(cls.id, subtopic)
                                    }
                                 />
                                 <span className="text-xs text-foreground">
                                    {subtopic}
                                 </span>
                              </label>
                           ))}
                        </div>
                     )}
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                           Actividades de la clase
                        </CardTitle>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="text-[10px]">
                              {completedActivitiesCount}/{activityChecklist.length}
                           </Badge>
                           <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => setAddingActivity((prev) => !prev)}
                              title="Agregar actividad"
                           >
                              {addingActivity ? (
                                 <X className="size-3.5" />
                              ) : (
                                 <Plus className="size-3.5" />
                              )}
                           </Button>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                     {addingActivity && (
                        <div className="mb-3 flex gap-2">
                           <Input
                              className="h-8 text-xs"
                              placeholder="Nueva actividad..."
                              value={newActivity}
                              onChange={(event) => setNewActivity(event.target.value)}
                           />
                           <Button size="sm" className="h-8 text-xs" onClick={handleAddActivity}>
                              Agregar
                           </Button>
                        </div>
                     )}
                     {activityChecklist.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                           No hay actividades descriptas para esta clase.
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {activityChecklist.map((activity) => (
                              <label
                                 key={activity}
                                 className="flex items-start gap-2.5 cursor-pointer"
                              >
                                 <Checkbox
                                    checked={record.completedActivities.includes(activity)}
                                    onCheckedChange={() =>
                                       toggleActivity(cls.id, activity)
                                    }
                                 />
                                 <span className="text-xs text-foreground">
                                    {activity}
                                 </span>
                              </label>
                           ))}
                        </div>
                     )}
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Observaciones de dictado
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <Label className="sr-only">Observaciones</Label>
                     <Textarea
                        className="text-xs min-h-[100px] resize-none"
                        placeholder="Que salio bien, que ajustar para la proxima clase, incidencias..."
                        value={record.notes ?? ""}
                        onChange={(event) => setNotes(cls.id, event.target.value)}
                     />
                  </CardContent>
               </Card>
            </div>

            <div className="xl:col-span-2">
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendanceWithDefaults}
                  setAttendance={(attendance) => setAttendance(cls.id, attendance)}
                  onSave={() => toast.success("Asistencia guardada.")}
               />
            </div>
         </div>
      </div>
   );
}


