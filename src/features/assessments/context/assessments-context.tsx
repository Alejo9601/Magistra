import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
   createAssessmentId,
   loadAssessments,
   saveAssessments,
} from "@/features/assessments/services/assessments-service";
import type { Assessment, AssessmentStatus, AssessmentType } from "@/types";

export type { Assessment, AssessmentStatus, AssessmentType };

type NewAssessmentInput = {
   subjectId: string;
   title: string;
   description?: string;
   date: string;
   type: AssessmentType;
   status?: AssessmentStatus;
   weight?: number;
   maxScore?: number;
};

type UpdateAssessmentInput = {
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
   addAssessment: (input: NewAssessmentInput) => Assessment;
   updateAssessment: (id: string, patch: UpdateAssessmentInput) => void;
   removeAssessment: (id: string) => void;
};

const AssessmentsContext = createContext<AssessmentsContextValue | null>(null);

export function AssessmentsProvider({ children }: { children: React.ReactNode }) {
   const [assessments, setAssessments] = useState<Assessment[]>(loadAssessments);

   useEffect(() => {
      saveAssessments(assessments);
   }, [assessments]);

   const value = useMemo<AssessmentsContextValue>(
      () => ({
         assessments,
         getAssessmentsBySubject: (subjectId) =>
            assessments.filter((assessment) => assessment.subjectId === subjectId),
         addAssessment: (input) => {
            const nextAssessment: Assessment = {
               id: createAssessmentId(),
               subjectId: input.subjectId,
               title: input.title.trim(),
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
            setAssessments((prev) =>
               prev.map((assessment) =>
                  assessment.id === id
                     ? {
                          ...assessment,
                          ...patch,
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
      }),
      [assessments],
   );

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

