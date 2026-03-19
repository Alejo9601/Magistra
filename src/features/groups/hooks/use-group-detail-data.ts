import { useMemo } from "react";
import { getClassesByAssignment } from "@/lib/edu-repository";
import type { Assessment, ClassroomRecord, Student, SubjectActivity } from "@/types";

type UseGroupDetailDataParams = {
   assignmentId: string;
   studentSearch: string;
   groupStudents: Student[];
   getRecord: (classId: string) => ClassroomRecord;
   getAssessmentsByAssignment: (assignmentId: string) => Assessment[];
   getActivitiesByAssignment: (assignmentId: string) => SubjectActivity[];
};

export function useGroupDetailData({
   assignmentId,
   studentSearch,
   groupStudents,
   getRecord,
   getAssessmentsByAssignment,
   getActivitiesByAssignment,
}: UseGroupDetailDataParams) {
   const groupClasses = useMemo(() => getClassesByAssignment(assignmentId), [assignmentId]);

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

   return {
      groupClasses,
      groupAssessments,
      filteredStudents,
      groupActivities,
      attendanceByStudent,
      groupAttendanceAverage,
      atRiskCount,
   };
}

