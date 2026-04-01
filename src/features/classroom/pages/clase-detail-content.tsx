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
import { useParams } from "react-router-dom";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { ClaseDetailActionsPanel } from "@/features/classroom/components/clase-detail-actions-panel";
import { ClaseDetailUnplannedAlert } from "@/features/classroom/components/clase-detail-unplanned-alert";

export function ClaseDetailContent({
   classId,
   embedded = false,
   onEditClass,
   onReplanClass: _onReplanClass,
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
   const { classes, markClassAsTaught, updateClassNotes, duplicateClass } =
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
   const [savedAttendanceSnapshot, setSavedAttendanceSnapshot] =
      useState<Record<string, AttendanceStatus>>(attendanceFromRecord);
   const [attendanceSavedFlash, setAttendanceSavedFlash] = useState(false);
   const [attendanceSavedAtLeastOnce, setAttendanceSavedAtLeastOnce] =
      useState(false);

   useEffect(() => {
      setAttendance(attendanceFromRecord);
      setSavedAttendanceSnapshot(attendanceFromRecord);
      setAttendanceSavedFlash(false);
      setAttendanceSavedAtLeastOnce(false);
   }, [attendanceFromRecord]);

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
   const hasStudents = classStudents.length > 0;
   const canStartClass = hasPlanning && hasStudents && !isDictada;
   const isPlanned = cls.status === "planificada";
   const attendanceReadonly = true;
   const hasAttendanceChanges = classStudents.some(
      (student) => attendance[student.id] !== savedAttendanceSnapshot[student.id],
   );

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
            <ClaseDetailUnplannedAlert classId={cls.id} onEditClass={onEditClass} />
         ) : null}

         <ClaseDetailActionsPanel
            classId={cls.id}
            canStartClass={canStartClass}
            hasPlanning={hasPlanning}
            isPlanned={isPlanned}
            isDictada={isDictada}
            onEditClass={onEditClass}
            onDuplicate={handleDuplicate}
         />

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
                  lockedMessage={
                     isDictada
                        ? "Clase finalizada. Comentarios en modo solo lectura."
                        : "No hay notas para esta clase aun."
                  }
               />
            </div>

            <div className="lg:col-span-2">
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendance}
                  setAttendance={setAttendance}
                  onSave={() => {
                     saveAttendance(cls.id, attendance);
                     setSavedAttendanceSnapshot(attendance);
                     setAttendanceSavedAtLeastOnce(true);
                     setAttendanceSavedFlash(true);
                     toast.success("Asistencia guardada correctamente");
                     window.setTimeout(() => setAttendanceSavedFlash(false), 1800);
                  }}
                  disabled={attendanceReadonly}
                  hasPendingChanges={hasAttendanceChanges}
                  savedFeedbackVisible={attendanceSavedFlash}
                  savedSnapshot={savedAttendanceSnapshot}
                  showSavedIndicators={attendanceSavedAtLeastOnce}
               />
               {attendanceReadonly ? (
                  <div className="mt-3 rounded-md border border-dashed border-border/70 bg-muted/25 p-3 text-center">
                     <p className="text-xs text-muted-foreground">
                        {isDictada
                           ? "Clase dictada. Asistencia en modo solo lectura."
                           : "Asistencia no computada."}
                     </p>
                  </div>
               ) : null}
            </div>
         </div>
      </div>
   );
}
