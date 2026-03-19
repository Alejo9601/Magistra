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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useActivitiesContext } from "@/features/activities";

export function ClaseDetailContent() {
   const params = useParams();
   const classId = params.id as string;
   const { getStudentsByAssignment } = useStudentsContext();
   const { classes, markClassAsTaught, updateClassNotes } = usePlanningContext();
   const { getRecord, setAttendance: saveAttendance } = useClassroomContext();
   const { getActivitiesByAssignment, toggleActivityLink } = useActivitiesContext();

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

   useEffect(() => {
      setAttendance(attendanceFromRecord);
   }, [attendanceFromRecord]);

   if (!cls || !subject || !inst) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const notes = notesDraftByClassId[cls.id] ?? cls.notes ?? "";

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
                           Actividades vinculadas a esta clase
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-0">
                        {subjectActivities.length === 0 ? (
                           <p className="text-xs text-muted-foreground">
                              No hay actividades creadas para esta materia.
                           </p>
                        ) : (
                           <div className="space-y-2">
                              {subjectActivities.map((activity) => (
                                 <label
                                    key={activity.id}
                                    className="flex items-start gap-2.5 cursor-pointer"
                                 >
                                    <Checkbox
                                       checked={activity.linkedClassIds.includes(
                                          cls.id,
                                       )}
                                       onCheckedChange={() =>
                                          toggleActivityLink(activity.id, cls.id)
                                       }
                                    />
                                    <span className="text-xs text-foreground">
                                       {activity.title}
                                    </span>
                                 </label>
                              ))}
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>
            </div>
         </div>
      </div>
   );
}




