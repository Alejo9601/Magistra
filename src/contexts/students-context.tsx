import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
   students as seedStudents,
   subjects,
   type Student,
} from "@/lib/edu-repository";

const STUDENTS_STORAGE_KEY = "aula.students";

type NewStudentInput = {
   subjectId: string;
   name: string;
   lastName: string;
   dni: string;
   email?: string;
   observations?: string;
};

type StudentsContextValue = {
   students: Student[];
   getStudentsByInstitution: (institutionId: string) => Student[];
   getStudentsBySubject: (subjectId: string) => Student[];
   addStudent: (input: NewStudentInput) => Student;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

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

function resolveInitialStudents() {
   if (typeof window === "undefined") {
      return seedStudents;
   }

   const persisted = window.localStorage.getItem(STUDENTS_STORAGE_KEY);
   if (!persisted) {
      return seedStudents;
   }

   try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) {
         return seedStudents;
      }

      const sanitized = parsed
         .map((entry) => sanitizeStudent(entry))
         .filter((entry): entry is Student => entry !== null);

      return sanitized.length > 0 ? sanitized : seedStudents;
   } catch {
      return seedStudents;
   }
}

function createStudentId() {
   return `stu-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function StudentsProvider({ children }: { children: React.ReactNode }) {
   const [students, setStudents] = useState<Student[]>(resolveInitialStudents);

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      window.localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
   }, [students]);

   const value = useMemo<StudentsContextValue>(
      () => ({
         students,
         getStudentsByInstitution: (institutionId) => {
            const subjectIdSet = new Set(
               subjects
                  .filter((subject) => subject.institutionId === institutionId)
                  .map((subject) => subject.id),
            );
            return students.filter((student) =>
               student.subjectIds.some((subjectId) => subjectIdSet.has(subjectId)),
            );
         },
         getStudentsBySubject: (subjectId) =>
            students.filter((student) => student.subjectIds.includes(subjectId)),
         addStudent: (input) => {
            const nextStudent: Student = {
               id: createStudentId(),
               name: input.name.trim(),
               lastName: input.lastName.trim(),
               dni: input.dni.trim(),
               email: input.email?.trim() || undefined,
               subjectIds: [input.subjectId],
               attendance: 100,
               average: 0,
               status: "regular",
               observations: input.observations?.trim() || undefined,
            };
            setStudents((prev) => [...prev, nextStudent]);
            return nextStudent;
         },
      }),
      [students],
   );

   return (
      <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>
   );
}

export function useStudentsContext() {
   const context = useContext(StudentsContext);
   if (!context) {
      throw new Error("useStudentsContext must be used within StudentsProvider.");
   }
   return context;
}
