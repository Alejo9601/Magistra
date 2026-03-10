import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { evaluations } from "@/lib/edu-repository";

const ASSESSMENTS_STORAGE_KEY = "aula.assessments";

export type AssessmentType = "exam" | "practice_work";
export type AssessmentStatus = "draft" | "scheduled" | "published" | "graded";

export type Assessment = {
   id: string;
   subjectId: string;
   title: string;
   description?: string;
   date: string;
   type: AssessmentType;
   status: AssessmentStatus;
   weight: number;
   maxScore: number;
   gradesLoaded: number;
};

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

function isAssessmentType(value: unknown): value is AssessmentType {
   return value === "exam" || value === "practice_work";
}

function isAssessmentStatus(value: unknown): value is AssessmentStatus {
   return (
      value === "draft" ||
      value === "scheduled" ||
      value === "published" ||
      value === "graded"
   );
}

function sanitizeAssessment(raw: unknown): Assessment | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const input = raw as Partial<Assessment>;
   if (
      typeof input.id !== "string" ||
      typeof input.subjectId !== "string" ||
      typeof input.title !== "string" ||
      typeof input.date !== "string" ||
      !isAssessmentType(input.type) ||
      !isAssessmentStatus(input.status) ||
      typeof input.weight !== "number" ||
      typeof input.maxScore !== "number" ||
      typeof input.gradesLoaded !== "number"
   ) {
      return null;
   }

   return {
      id: input.id,
      subjectId: input.subjectId,
      title: input.title,
      description:
         typeof input.description === "string" ? input.description : undefined,
      date: input.date,
      type: input.type,
      status: input.status,
      weight: input.weight,
      maxScore: input.maxScore,
      gradesLoaded: input.gradesLoaded,
   };
}

function seedAssessments(): Assessment[] {
   return evaluations.map((evaluation) => ({
      id: evaluation.id,
      subjectId: evaluation.subjectId,
      title: evaluation.name,
      date: evaluation.date,
      description: undefined,
      type: evaluation.type === "tp" ? "practice_work" : "exam",
      status: "scheduled",
      weight: 1,
      maxScore: 10,
      gradesLoaded: evaluation.grades.length,
   }));
}

function resolveInitialAssessments() {
   if (typeof window === "undefined") {
      return seedAssessments();
   }

   const persisted = window.localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
   if (!persisted) {
      return seedAssessments();
   }

   try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) {
         return seedAssessments();
      }
      const sanitized = parsed
         .map((entry) => sanitizeAssessment(entry))
         .filter((entry): entry is Assessment => entry !== null);
      return sanitized.length > 0 ? sanitized : seedAssessments();
   } catch {
      return seedAssessments();
   }
}

function createAssessmentId() {
   return `asm-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function AssessmentsProvider({ children }: { children: React.ReactNode }) {
   const [assessments, setAssessments] = useState<Assessment[]>(
      resolveInitialAssessments,
   );

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      window.localStorage.setItem(
         ASSESSMENTS_STORAGE_KEY,
         JSON.stringify(assessments),
      );
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
