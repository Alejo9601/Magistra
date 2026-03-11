import type { Student } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

const STUDENTS_STORAGE_KEY = "aula.students";

function isStudentStatus(value: unknown): value is Student["status"] {
   return value === "regular" || value === "en-riesgo" || value === "destacado";
}

function sanitizeStudent(raw: unknown): Student | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const input = raw as Partial<Student>;
   if (
      typeof input.id !== "string" ||
      typeof input.name !== "string" ||
      typeof input.lastName !== "string" ||
      typeof input.dni !== "string" ||
      !Array.isArray(input.subjectIds) ||
      typeof input.attendance !== "number" ||
      typeof input.average !== "number" ||
      !isStudentStatus(input.status)
   ) {
      return null;
   }

   return {
      id: input.id,
      name: input.name,
      lastName: input.lastName,
      dni: input.dni,
      email: typeof input.email === "string" ? input.email : undefined,
      subjectIds: input.subjectIds.filter(
         (subjectId): subjectId is string => typeof subjectId === "string",
      ),
      attendance: input.attendance,
      average: input.average,
      status: input.status,
      observations:
         typeof input.observations === "string" ? input.observations : undefined,
   };
}

export function loadStudents(seedStudents: Student[]) {
   return readJsonFromStorage(STUDENTS_STORAGE_KEY, seedStudents, (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeStudent(entry))
         .filter((entry): entry is Student => entry !== null);
      return sanitized.length > 0 ? sanitized : seedStudents;
   });
}

export function saveStudents(students: Student[]) {
   writeJsonToStorage(STUDENTS_STORAGE_KEY, students);
}

export function createStudentId() {
   return `stu-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
