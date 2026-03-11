import rawData from "@/data/edu-data.json";
import type {
   AttendanceRecord,
   ClassSession,
   ContentItem,
   Enrollment,
   Evaluation,
   Institution,
   Student,
   Subject,
   TeachingAssignment,
   TeacherProfile,
} from "@/types";

export type {
   AttendanceRecord,
   ClassSession,
   ContentItem,
   Enrollment,
   Evaluation,
   Institution,
   Student,
   Subject,
   TeachingAssignment,
   TeacherProfile,
};

export const institutions = rawData.institutions as Institution[];
export const subjects = rawData.subjects as Subject[];
export const students = rawData.students as Student[];
export const classSessions = rawData.classSessions as ClassSession[];
export const evaluations = rawData.evaluations as Evaluation[];
export const contentItems = rawData.contentItems as ContentItem[];
export const attendanceRecords = rawData.attendanceRecords as AttendanceRecord[];
export const teacherProfile = rawData.teacherProfile as TeacherProfile;

export const teachingAssignments: TeachingAssignment[] = subjects.map((subject) => ({
   id: `asg-${subject.id}`,
   institutionId: subject.institutionId,
   subjectId: subject.id,
   section: subject.course,
   active: true,
}));

export const enrollments: Enrollment[] = students.flatMap((student) =>
   student.subjectIds.map((subjectId) => ({
      id: `enr-${student.id}-${subjectId}`,
      studentId: student.id,
      assignmentId: `asg-${subjectId}`,
      active: true,
   })),
);

export function getAssignmentIdBySubjectId(subjectId: string) {
   return `asg-${subjectId}`;
}

export function getSubjectIdByAssignmentId(assignmentId: string) {
   const assignment = teachingAssignments.find((item) => item.id === assignmentId);
   return assignment?.subjectId;
}

export function getAssignmentById(id: string) {
   return teachingAssignments.find((assignment) => assignment.id === id);
}

export function getAssignmentsByInstitution(institutionId: string) {
   return teachingAssignments.filter(
      (assignment) =>
         assignment.institutionId === institutionId && assignment.active,
   );
}

export function getSubjectById(id: string) {
   return subjects.find((s) => s.id === id);
}

export function getInstitutionById(id: string) {
   return institutions.find((i) => i.id === id);
}

export function getStudentsBySubject(subjectId: string) {
   return students.filter((s) => s.subjectIds.includes(subjectId));
}

export function getStudentsByAssignment(assignmentId: string) {
   const studentIdSet = new Set(
      enrollments
         .filter(
            (enrollment) =>
               enrollment.assignmentId === assignmentId && enrollment.active,
         )
         .map((enrollment) => enrollment.studentId),
   );
   return students.filter((student) => studentIdSet.has(student.id));
}

export function getSubjectsByInstitution(institutionId: string) {
   return subjects.filter((s) => s.institutionId === institutionId);
}

export function getStudentsByInstitution(institutionId: string) {
   const subjectIdSet = new Set(
      getSubjectsByInstitution(institutionId).map((s) => s.id),
   );
   return students.filter((s) =>
      s.subjectIds.some((subjectId) => subjectIdSet.has(subjectId)),
   );
}

export function getClassesByDate(date: string) {
   return classSessions.filter((c) => c.date === date);
}

export function getClassesBySubject(subjectId: string) {
   return classSessions.filter((c) => c.subjectId === subjectId);
}

export function getClassesByAssignment(assignmentId: string) {
   return classSessions.filter((classSession) => {
      if (classSession.assignmentId) {
         return classSession.assignmentId === assignmentId;
      }
      return getAssignmentIdBySubjectId(classSession.subjectId) === assignmentId;
   });
}

export function getClassesByInstitution(institutionId: string) {
   return classSessions.filter((c) => c.institutionId === institutionId);
}

export function getContentBySubject(subjectId: string) {
   return contentItems.filter((c) => c.subjectId === subjectId);
}

export function getContentByInstitution(institutionId: string) {
   return contentItems.filter((c) => c.institutionId === institutionId);
}

export function getEvaluationsBySubject(subjectId: string) {
   return evaluations.filter((e) => e.subjectId === subjectId);
}

export function getInstitutionRepository(institutionId: string) {
   const scopedSubjects = getSubjectsByInstitution(institutionId);
   const subjectIds = new Set(scopedSubjects.map((subject) => subject.id));

   return {
      institutionId,
      getSubjects: () => scopedSubjects,
      getStudents: () =>
         students.filter((student) =>
            student.subjectIds.some((subjectId) => subjectIds.has(subjectId)),
         ),
      getClasses: () =>
         classSessions.filter(
            (classSession) => classSession.institutionId === institutionId,
         ),
      getContent: () =>
         contentItems.filter((content) => content.institutionId === institutionId),
      getSubjectsMap: () =>
         new Map(scopedSubjects.map((subject) => [subject.id, subject])),
      getUpcomingClasses: (fromDate: string) =>
         classSessions
            .filter(
               (classSession) =>
                  classSession.institutionId === institutionId &&
                  classSession.date >= fromDate,
            )
            .sort((a, b) =>
               `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
            ),
   };
}

export type InstitutionRepository = ReturnType<typeof getInstitutionRepository>;
