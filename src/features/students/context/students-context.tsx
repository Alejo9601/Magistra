import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { students as seedStudents, subjects } from "@/lib/edu-repository";
import type { Student } from "@/types";
import {
   createStudentId,
   loadStudents,
   saveStudents,
} from "@/features/students/services/students-service";

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

export function StudentsProvider({ children }: { children: React.ReactNode }) {
   const [students, setStudents] = useState<Student[]>(() =>
      loadStudents(seedStudents),
   );

   useEffect(() => {
      saveStudents(students);
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

