import { createContext, useContext, useEffect, useState } from "react";
import {
   getAssignmentById,
   students as seedStudents,
   subjects,
} from "@/lib/edu-repository";
import type { Student } from "@/types";
import {
   createStudentId,
   loadStudents,
   saveStudents,
} from "@/features/students/services/students-service";

type NewStudentInput = {
   assignmentId: string;
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
   getStudentsByAssignment: (assignmentId: string) => Student[];
   addStudent: (input: NewStudentInput) => Student;
   importSectionStudentsToAssignment: (
      assignmentId: string,
   ) => { linked: number; alreadyInGroup: number; noSourceStudents: boolean };
   unlinkSubjectFromStudents: (subjectId: string) => void;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
   const [students, setStudents] = useState<Student[]>(() =>
      loadStudents(seedStudents),
   );

   useEffect(() => {
      saveStudents(students);
   }, [students]);

   const value: StudentsContextValue = {
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
      getStudentsByAssignment: (assignmentId) => {
         const assignment = getAssignmentById(assignmentId);
         if (!assignment) {
            return [];
         }
         return students.filter((student) =>
            student.subjectIds.includes(assignment.subjectId),
         );
      },
      addStudent: (input) => {
         const assignment = getAssignmentById(input.assignmentId);
         if (!assignment) {
            throw new Error("Assignment not found for student creation.");
         }

         const normalizedDni = input.dni.trim();
         const existingByDni = students.find(
            (student) => student.dni.trim() === normalizedDni,
         );

         if (existingByDni) {
            const existingInstitutionId = subjects.find((subject) =>
               existingByDni.subjectIds.includes(subject.id),
            )?.institutionId;

            if (
               existingInstitutionId &&
               existingInstitutionId !== assignment.institutionId
            ) {
               throw new Error(
                  "El alumno ya existe en otra institucion. Solo puede pertenecer a una institucion.",
               );
            }

            if (!existingByDni.subjectIds.includes(assignment.subjectId)) {
               const updated: Student = {
                  ...existingByDni,
                  subjectIds: [...existingByDni.subjectIds, assignment.subjectId],
               };
               setStudents((prev) =>
                  prev.map((student) =>
                     student.id === existingByDni.id ? updated : student,
                  ),
               );
               return updated;
            }

            return existingByDni;
         }

         const nextStudent: Student = {
            id: createStudentId(),
            name: input.name.trim(),
            lastName: input.lastName.trim(),
            dni: normalizedDni,
            email: input.email?.trim() || undefined,
            subjectIds: [assignment.subjectId],
            attendance: 100,
            average: 0,
            status: "regular",
            observations: input.observations?.trim() || undefined,
         };

         setStudents((prev) => [...prev, nextStudent]);
         return nextStudent;
      },
      importSectionStudentsToAssignment: (assignmentId) => {
         const targetAssignment = getAssignmentById(assignmentId);
         if (!targetAssignment) {
            throw new Error("Assignment not found for section import.");
         }

         const sameSectionSubjectIds = subjects
            .filter(
               (subject) =>
                  subject.institutionId === targetAssignment.institutionId &&
                  subject.course === targetAssignment.section &&
                  subject.id !== targetAssignment.subjectId,
            )
            .map((subject) => subject.id);

         const sourceStudents = students.filter((student) =>
            student.subjectIds.some((subjectId) =>
               sameSectionSubjectIds.includes(subjectId),
            ),
         );

         if (sourceStudents.length === 0) {
            return { linked: 0, alreadyInGroup: 0, noSourceStudents: true };
         }

         let linked = 0;
         let alreadyInGroup = 0;

         setStudents((prev) =>
            prev.map((student) => {
               const isSource = sourceStudents.some((item) => item.id === student.id);
               if (!isSource) {
                  return student;
               }

               if (student.subjectIds.includes(targetAssignment.subjectId)) {
                  alreadyInGroup += 1;
                  return student;
               }

               linked += 1;
               return {
                  ...student,
                  subjectIds: [...student.subjectIds, targetAssignment.subjectId],
               };
            }),
         );

         return { linked, alreadyInGroup, noSourceStudents: false };
      },
      unlinkSubjectFromStudents: (subjectId) => {
         setStudents((prev) =>
            prev
               .map((student) => ({
                  ...student,
                  subjectIds: student.subjectIds.filter((id) => id !== subjectId),
               }))
               .filter((student) => student.subjectIds.length > 0),
         );
      },
   };

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

