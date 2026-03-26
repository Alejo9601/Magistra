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
import { Copy, Edit3, RotateCcw } from "lucide-react";

export function ClaseDetailContent({
   classId,
   embedded = false,
   onEditClass,
   onReplanClass,
   onDuplicateClass,
}: {
   classId?: string;
   embedded?: boolean;
   onEditClass?: (id: string) => void;
   onReplanClass?: (id: string) => void;
   onDuplicateClass?: (id: string) => void;
}) {
   const params = useParams();
   const resolvedClassId = classId ?? (params.id as string);
   const { getStudentsByAssignment } = useStudentsContext();
   const { classes, markClassAsTaught, updateClassNotes, updateClass, duplicateClass } =
      usePlanningContext();
   const { getRecord, setAttendance: saveAttendance } = useClassroomContext();

   const cls = classes.find((classSession) => classSession.id === resolvedClassId);

   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const inst = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];

   const attendanceFromRecord = useMemo<Record<string, AttendanceStatus>>(() => {
      const record = getRecord(resolvedClassId);
      return Object.fromEntries(
         classStudents.map((student) => [
            student.id,
            record.attendance[student.id] ?? ("P" as AttendanceStatus),
         ]),
      );
   }, [resolvedClassId, classStudents, getRecord]);

   const [attendance, setAttendance] =
      useState<Record<string, AttendanceStatus>>(attendanceFromRecord);
   const [notesDraftByClassId, setNotesDraftByClassId] = useState<Record<string, string>>(
      {},
   );
   const [allowDictadaAttendanceEdit, setAllowDictadaAttendanceEdit] = useState(false);

   useEffect(() => {
      setAttendance(attendanceFromRecord);
   }, [attendanceFromRecord]);

   useEffect(() => {
      setAllowDictadaAttendanceEdit(false);
   }, [resolvedClassId]);

   if (!cls || !subject || !inst) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const notes = notesDraftByClassId[cls.id] ?? cls.notes ?? "";
   const isDictada = cls.status === "dictada";
   const hasPlanning = cls.status !== "sin_planificar";
   const isPlanned = cls.status === "planificada";
   const attendanceReadonly = !isDictada || (isDictada && !allowDictadaAttendanceEdit);

   const handleReplan = () => {
      if (onReplanClass) {
         onReplanClass(cls.id);
         return;
      }
      if (cls.status === "planificada") {
         updateClass(cls.id, { status: "sin_planificar" });
         toast.success("Clase enviada a sin_planificar.");
      }
   };

   const handleDuplicate = () => {
      if (onDuplicateClass) {
         onDuplicateClass(cls.id);
         return;
      }
      const duplicated = duplicateClass(cls.id);
      if (duplicated) {
         toast.success("Clase duplicada para la semana siguiente.");
      }
   };

   return (
      <div className={embedded ? "w-full p-1" : "mx-auto w-full max-w-7xl px-3 py-4 sm:p-6"}>
         <ClassDetailHeader
            topic={cls.topic}
            subjectName={subject.name}
            course={subject.course}
            showBack={!embedded}
         />

         {cls.status === "sin_planificar" ? (
            <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 p-3">
               <p className="text-sm font-medium text-foreground">Esta clase no esta planificada</p>
               <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => (onEditClass ? onEditClass(cls.id) : undefined)}
                  disabled={!onEditClass}
               >
                  Planificar ahora
               </Button>
            </div>
         ) : null}

         <div className="mb-4 flex flex-wrap gap-2">
            {hasPlanning ? (
               <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link to={`/clase/${cls.id}/dictado`}>Iniciar clase</Link>
               </Button>
            ) : (
               <Button variant="outline" size="sm" className="text-xs" disabled>
                  Iniciar clase
               </Button>
            )}
            <Button
               variant="outline"
               size="sm"
               className="text-xs"
               onClick={() => (onEditClass ? onEditClass(cls.id) : undefined)}
               disabled={!onEditClass || !isPlanned}
            >
               <Edit3 className="mr-1.5 size-3.5" />
               Editar planificacion
            </Button>
            <Button
               variant="outline"
               size="sm"
               className="text-xs"
               onClick={handleReplan}
               disabled={!isPlanned}
            >
               <RotateCcw className="mr-1.5 size-3.5" />
               Replanificar
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={handleDuplicate}>
               <Copy className="mr-1.5 size-3.5" />
               Duplicar
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
                  lockedMessage={isDictada ? undefined : "No hay notas para esta clase aun."}
               />
            </div>

            <div className="lg:col-span-2">
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendance}
                  setAttendance={setAttendance}
                  onSave={() => {
                     saveAttendance(cls.id, attendance);
                     toast.success("Asistencia guardada correctamente");
                  }}
                  disabled={attendanceReadonly}
               />
               {attendanceReadonly ? (
                  <div className="mt-3 rounded-md border border-dashed border-border/70 bg-muted/25 p-3 text-center">
                     <p className="text-xs text-muted-foreground">
                        {isDictada
                           ? "Clase dictada. Asistencia en modo solo lectura."
                           : "Asistencia no computada."}
                     </p>
                     {isDictada ? (
                        <Button
                           type="button"
                           size="sm"
                           variant="outline"
                           className="mt-2 text-xs"
                           onClick={() => {
                              setAllowDictadaAttendanceEdit(true);
                              toast.warning(
                                 "Estas editando asistencia de una clase dictada bajo tu responsabilidad.",
                              );
                           }}
                        >
                           Editar asistencia de todos modos
                        </Button>
                     ) : null}
                  </div>
               ) : null}
            </div>
         </div>
      </div>
   );
}

