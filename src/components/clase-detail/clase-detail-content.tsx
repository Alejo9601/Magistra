import { useMemo, useState } from "react";
import { getInstitutionById, getSubjectById } from "@/lib/edu-repository";
import { usePlanningContext } from "@/contexts/planning-context";
import { toast } from "sonner";
import { type AttendanceStatus } from "@/components/clase-detail/constants";
import {
   ClassDetailHeader,
   ClassInfoCard,
} from "@/components/clase-detail/class-info-card";
import { ClassNotesCard } from "@/components/clase-detail/class-notes-card";
import { AttendanceCard } from "@/components/clase-detail/attendance-card";
import { Link, useParams } from "react-router-dom";
import { useStudentsContext } from "@/contexts/students-context";
import { Button } from "@/components/ui/button";

export function ClaseDetailContent() {
   const params = useParams();
   const classId = params.id as string;
   const { students } = useStudentsContext();
   const { classes, markClassAsTaught, updateClassNotes } = usePlanningContext();

   const cls = useMemo(
      () => classes.find((classSession) => classSession.id === classId),
      [classes, classId],
   );

   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const inst = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = subject
      ? students.filter((student) => student.subjectIds.includes(subject.id))
      : [];

   const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
      Object.fromEntries(
         classStudents.map((student) => [student.id, "P" as AttendanceStatus]),
      ),
   );
   const [notesDraftByClassId, setNotesDraftByClassId] = useState<
      Record<string, string>
   >({});

   if (!cls || !subject || !inst) {
      return (
         <div className="p-6 max-w-7xl mx-auto">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const notes = notesDraftByClassId[cls.id] ?? cls.notes ?? "";

   return (
      <div className="p-6 max-w-7xl mx-auto">
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
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendance}
                  setAttendance={setAttendance}
                  onSave={() => toast.success("Asistencia guardada correctamente")}
               />
            </div>
         </div>
      </div>
   );
}
