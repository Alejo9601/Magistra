import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import { defaultEduData } from "@/data/default-edu-data";
import { storageKeys } from "@/services/app-data-bootstrap-service";
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

const seedInstitutions = defaultEduData.institutions as Institution[];
const seedSubjects = defaultEduData.subjects as Subject[];
const seedStudents = defaultEduData.students as Student[];
const seedClassSessions = defaultEduData.classSessions as ClassSession[];
const seedEvaluations = defaultEduData.evaluations as Evaluation[];
const seedContentItems = defaultEduData.contentItems as ContentItem[];
const seedAttendanceRecords = defaultEduData.attendanceRecords as AttendanceRecord[];
const seedTeacherProfile = defaultEduData.teacherProfile as TeacherProfile;

export const students = readJsonFromStorage(storageKeys.students, seedStudents, (raw) =>
   Array.isArray(raw) ? (raw as Student[]) : null,
);
export const classSessions = readJsonFromStorage(
   storageKeys.planningClasses,
   seedClassSessions,
   (raw) => (Array.isArray(raw) ? (raw as ClassSession[]) : null),
);
export const evaluations = readJsonFromStorage(
   storageKeys.evaluations,
   seedEvaluations,
   (raw) => (Array.isArray(raw) ? (raw as Evaluation[]) : null),
);
export const attendanceRecords = readJsonFromStorage(
   storageKeys.attendanceRecords,
   seedAttendanceRecords,
   (raw) => (Array.isArray(raw) ? (raw as AttendanceRecord[]) : null),
);
export const teacherProfile = readJsonFromStorage(
   storageKeys.teacherProfile,
   seedTeacherProfile,
   (raw) => (raw && typeof raw === "object" ? (raw as TeacherProfile) : null),
);

function sanitizeInstitution(raw: unknown): Institution | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<Institution>;
   if (
      typeof input.id !== "string" ||
      typeof input.name !== "string" ||
      typeof input.address !== "string" ||
      typeof input.level !== "string" ||
      typeof input.color !== "string"
   ) {
      return null;
   }
   return {
      id: input.id,
      name: input.name,
      address: input.address,
      level: input.level,
      color: input.color,
   };
}

function isAcademicPeriodFormat(value: unknown): value is Subject["periodFormat"] {
   return value === "trimestral" || value === "cuatrimestral";
}

function sanitizeSubject(raw: unknown): Subject | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<Subject>;
   if (
      typeof input.id !== "string" ||
      typeof input.name !== "string" ||
      typeof input.institutionId !== "string" ||
      typeof input.course !== "string" ||
      typeof input.studentCount !== "number" ||
      typeof input.planProgress !== "number"
   ) {
      return null;
   }
   return {
      id: input.id,
      name: input.name,
      institutionId: input.institutionId,
      course: input.course,
      periodFormat: isAcademicPeriodFormat(input.periodFormat)
         ? input.periodFormat
         : "trimestral",
      studentCount: input.studentCount,
      planProgress: input.planProgress,
   };
}

function sanitizeContentItem(raw: unknown): ContentItem | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<ContentItem>;
   if (
      typeof input.id !== "string" ||
      typeof input.name !== "string" ||
      typeof input.description !== "string" ||
      typeof input.subjectId !== "string" ||
      typeof input.institutionId !== "string" ||
      !Array.isArray(input.unit) ||
      typeof input.type !== "string" ||
      typeof input.fileType !== "string" ||
      typeof input.uploadDate !== "string" ||
      !Array.isArray(input.tags)
   ) {
      return null;
   }
   return {
      id: input.id,
      name: input.name,
      description: input.description,
      subjectId: input.subjectId,
      institutionId: input.institutionId,
      unit: input.unit.filter((entry): entry is string => typeof entry === "string"),
      type: input.type as ContentItem["type"],
      fileType: input.fileType as ContentItem["fileType"],
      uploadDate: input.uploadDate,
      tags: input.tags.filter((entry): entry is string => typeof entry === "string"),
   };
}

export let subjects: Subject[] = readJsonFromStorage(
   storageKeys.subjects,
   seedSubjects,
   (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeSubject(entry))
         .filter((entry): entry is Subject => entry !== null);
      return sanitized.length > 0 ? sanitized : seedSubjects;
   },
);

export let institutions: Institution[] = readJsonFromStorage(
   storageKeys.institutions,
   seedInstitutions,
   (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeInstitution(entry))
         .filter((entry): entry is Institution => entry !== null);
      return sanitized.length > 0 ? sanitized : seedInstitutions;
   },
);

export let contentItems: ContentItem[] = readJsonFromStorage(
   storageKeys.contentItems,
   seedContentItems,
   (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeContentItem(entry))
         .filter((entry): entry is ContentItem => entry !== null);
      return sanitized.length > 0 ? sanitized : seedContentItems;
   },
);

export let teachingAssignments: TeachingAssignment[] = [];
export let enrollments: Enrollment[] = [];

function rebuildDerivedCollections() {
   teachingAssignments = subjects.map((subject) => ({
      id: `asg-${subject.id}`,
      institutionId: subject.institutionId,
      subjectId: subject.id,
      section: subject.course,
      active: true,
   }));

   enrollments = students.flatMap((student) =>
      student.subjectIds.map((subjectId) => ({
         id: `enr-${student.id}-${subjectId}`,
         studentId: student.id,
         assignmentId: `asg-${subjectId}`,
         active: true,
      })),
   );
}

function persistSubjects() {
   writeJsonToStorage(storageKeys.subjects, subjects);
}

function persistInstitutions() {
   writeJsonToStorage(storageKeys.institutions, institutions);
}

function persistContentItems() {
   writeJsonToStorage(storageKeys.contentItems, contentItems);
}

rebuildDerivedCollections();

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

export function createSubject(input: {
   institutionId: string;
   name: string;
   course: string;
   periodFormat: Subject["periodFormat"];
}) {
   const next: Subject = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      institutionId: input.institutionId,
      name: input.name.trim(),
      course: input.course.trim(),
      periodFormat: input.periodFormat,
      studentCount: 0,
      planProgress: 0,
   };
   subjects = [...subjects, next];
   rebuildDerivedCollections();
   persistSubjects();
   return next;
}

export function createInstitution(input: {
   name: string;
   address: string;
   level: string;
   color: string;
}) {
   const next: Institution = {
      id: `inst-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: input.name.trim(),
      address: input.address.trim(),
      level: input.level.trim(),
      color: input.color,
   };
   institutions = [...institutions, next];
   persistInstitutions();
   return next;
}

export function deleteSubject(subjectId: string) {
   const exists = subjects.some((subject) => subject.id === subjectId);
   if (!exists) {
      return false;
   }

   subjects = subjects.filter((subject) => subject.id !== subjectId);
   contentItems = contentItems.filter((item) => item.subjectId !== subjectId);

   rebuildDerivedCollections();
   persistSubjects();
   persistContentItems();
   return true;
}

export function deleteInstitution(institutionId: string) {
   const exists = institutions.some((institution) => institution.id === institutionId);
   if (!exists || institutions.length <= 1) {
      return false;
   }

   institutions = institutions.filter(
      (institution) => institution.id !== institutionId,
   );
   subjects = subjects.filter((subject) => subject.institutionId !== institutionId);
   contentItems = contentItems.filter(
      (content) => content.institutionId !== institutionId,
   );

   rebuildDerivedCollections();
   persistInstitutions();
   persistSubjects();
   persistContentItems();
   return true;
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
