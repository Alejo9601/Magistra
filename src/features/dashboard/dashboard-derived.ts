import { getSubjectById } from "@/lib/edu-repository";
import type { SubjectActivity, Assessment, ClassSession, Student } from "@/types";

export type SuggestedDashboardTask = {
   id: string;
   text: string;
};

function addDays(dateStr: string, days: number) {
   const date = new Date(`${dateStr}T12:00:00`);
   date.setDate(date.getDate() + days);
   const yyyy = date.getFullYear();
   const mm = String(date.getMonth() + 1).padStart(2, "0");
   const dd = String(date.getDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

function computeStudentAttendancePct(
   student: Student,
   institutionClasses: ClassSession[],
   getAttendanceByClassId: (
      classId: string,
      studentId: string,
   ) => "P" | "A" | "T" | "J" | undefined,
) {
   const subjectIdSet = new Set(student.subjectIds);
   const relevantClasses = institutionClasses.filter((classSession) =>
      subjectIdSet.has(classSession.subjectId),
   );
   const statuses = relevantClasses
      .map((classSession) => getAttendanceByClassId(classSession.id, student.id))
      .filter((status): status is "P" | "A" | "T" | "J" => Boolean(status));

   if (statuses.length === 0) {
      return student.attendance;
   }

   const attendedWeight = statuses.reduce((sum, status) => {
      if (status === "P" || status === "J") return sum + 1;
      if (status === "T") return sum + 0.5;
      return sum;
   }, 0);

   return Math.round((attendedWeight / statuses.length) * 100);
}

export function getAtRiskStudentsFromLiveData(
   students: Student[],
   institutionClasses: ClassSession[],
   getAttendanceByClassId: (
      classId: string,
      studentId: string,
   ) => "P" | "A" | "T" | "J" | undefined,
) {
   return students.filter((student) => {
      const attendancePct = computeStudentAttendancePct(
         student,
         institutionClasses,
         getAttendanceByClassId,
      );
      return attendancePct < 65 || student.average < 6 || student.status === "en-riesgo";
   });
}

export function getSuggestedDashboardTasks(params: {
   todayStr: string;
   classes: ClassSession[];
   assessments: Assessment[];
   activities: SubjectActivity[];
   atRiskStudents: Student[];
}) {
   const { todayStr, classes, assessments, activities, atRiskStudents } = params;
   const tasks: SuggestedDashboardTask[] = [];
   const upcomingWindowEnd = addDays(todayStr, 14);

   classes
      .filter(
         (classSession) =>
            classSession.status === "sin-planificar" &&
            classSession.date >= todayStr &&
            classSession.date <= upcomingWindowEnd,
      )
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 3)
      .forEach((classSession) => {
         const subject = getSubjectById(classSession.subjectId);
         tasks.push({
            id: `class-${classSession.id}`,
            text: `Planificar ${subject?.name ?? "clase"} del ${classSession.date} ${classSession.time}`,
         });
      });

   assessments
      .filter((assessment) => assessment.status === "draft" || assessment.status === "scheduled")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .forEach((assessment) => {
         tasks.push({
            id: `assessment-${assessment.id}`,
            text: `Revisar evaluacion: ${assessment.title}`,
         });
      });

   activities
      .filter((activity) => activity.status === "draft" || activity.status === "planned")
      .slice(0, 3)
      .forEach((activity) => {
         tasks.push({
            id: `activity-${activity.id}`,
            text: `Asignar actividad: ${activity.title}`,
         });
      });

   atRiskStudents.slice(0, 2).forEach((student) => {
      tasks.push({
         id: `risk-${student.id}`,
         text: `Revisar seguimiento de ${student.name} ${student.lastName}`,
      });
   });

   return tasks;
}
