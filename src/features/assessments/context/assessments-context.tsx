import { createContext, useContext, useEffect, useState } from "react";
import {
   createAssessmentId,
   loadAssessments,
   saveAssessments,
} from "@/features/assessments/services/assessments-service";
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
} from "@/lib/edu-repository";
import type { Assessment, AssessmentStatus, AssessmentType } from "@/types";

export type { Assessment, AssessmentStatus, AssessmentType };

type NewAssessmentInput = {
   assignmentId: string;
   linkedClassId?: string;
   title: string;
   description?: string;
   date: string;
   type: AssessmentType;
   status?: AssessmentStatus;
   weight?: number;
   maxScore?: number;
};

type UpdateAssessmentInput = {
   assignmentId?: string;
   linkedClassId?: string;
   title?: string;
   description?: string;
   date?: string;
   type?: AssessmentType;
   status?: AssessmentStatus;
   weight?: number;
   maxScore?: number;
   gradesLoaded?: number;
};

type AssessmentsContextValue = {
   assessments: Assessment[];
   getAssessmentsBySubject: (subjectId: string) => Assessment[];
   getAssessmentsByAssignment: (assignmentId: string) => Assessment[];
   addAssessment: (input: NewAssessmentInput) => Assessment;
   updateAssessment: (id: string, patch: UpdateAssessmentInput) => void;
   removeAssessment: (id: string) => void;
   removeAssessmentsByAssignment: (assignmentId: string) => void;
};

const AssessmentsContext = createContext<AssessmentsContextValue | null>(null);

export function AssessmentsProvider({ children }: { children: React.ReactNode }) {
   const [assessments, setAssessments] = useState<Assessment[]>(loadAssessments);

   useEffect(() => {
      saveAssessments(assessments);
   }, [assessments]);

   const value: AssessmentsContextValue = {
      assessments,
      getAssessmentsBySubject: (subjectId) =>
         assessments.filter((assessment) => assessment.subjectId === subjectId),
      getAssessmentsByAssignment: (assignmentId) =>
         assessments.filter(
            (assessment) =>
               (assessment.assignmentId ??
                  getAssignmentIdBySubjectId(assessment.subjectId)) === assignmentId,
         ),
      addAssessment: (input) => {
         const assignment = getAssignmentById(input.assignmentId);
         if (!assignment) {
            throw new Error("Assignment not found for assessment creation.");
         }
         const nextAssessment: Assessment = {
            id: createAssessmentId(),
            subjectId: assignment.subjectId,
            assignmentId: assignment.id,
            title: input.title.trim(),
            linkedClassId: input.linkedClassId,
            description: input.description?.trim() || undefined,
            date: input.date,
            type: input.type,
            status: input.status ?? "draft",
            weight: input.weight ?? 1,
            maxScore: input.maxScore ?? 10,
            gradesLoaded: 0,
         };
         setAssessments((prev) => [...prev, nextAssessment]);
         return nextAssessment;
      },
      updateAssessment: (id, patch) => {
         const assignment = patch.assignmentId
            ? getAssignmentById(patch.assignmentId)
            : null;
         setAssessments((prev) =>
            prev.map((assessment) =>
               assessment.id === id
                  ? {
                       ...assessment,
                       ...patch,
                       subjectId: assignment?.subjectId ?? assessment.subjectId,
                       assignmentId: assignment?.id ?? assessment.assignmentId,
                       title: patch.title?.trim() ?? assessment.title,
                       description:
                          patch.description === undefined
                             ? assessment.description
                             : patch.description.trim() || undefined,
                    }
                  : assessment,
            ),
         );
      },
      removeAssessment: (id) => {
         setAssessments((prev) =>
            prev.filter((assessment) => assessment.id !== id),
         );
      },
      removeAssessmentsByAssignment: (assignmentId) => {
         setAssessments((prev) =>
            prev.filter(
               (assessment) =>
                  (assessment.assignmentId ??
                     getAssignmentIdBySubjectId(assessment.subjectId)) !==
                  assignmentId,
            ),
         );
      },
   };

   return (
      <AssessmentsContext.Provider value={value}>
         {children}
      </AssessmentsContext.Provider>
   );
}

export function useAssessmentsContext() {
   const context = useContext(AssessmentsContext);
   if (!context) {
      throw new Error(
         "useAssessmentsContext must be used within AssessmentsProvider.",
      );
   }
   return context;
}
