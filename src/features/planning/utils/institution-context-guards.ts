import { isAllInstitutionsScope } from "@/features/institution";

type AssignmentRef = {
   id: string;
   institutionId: string;
};

type ResolveAssignmentIdParams = {
   institutionId: string;
   candidateAssignmentId?: string;
   assignmentsByInstitution: AssignmentRef[];
   getAssignmentById: (assignmentId: string) => AssignmentRef | null | undefined;
};

export function resolveInstitutionId(
   activeInstitution: string,
   initialInstitutionId?: string,
   fallbackInstitutionId?: string,
) {
   const resolvedInstitutionId = initialInstitutionId ?? activeInstitution;
   if (!isAllInstitutionsScope(resolvedInstitutionId)) {
      return resolvedInstitutionId;
   }
   return fallbackInstitutionId ?? "";
}

export function resolveAssignmentIdForInstitution({
   institutionId,
   candidateAssignmentId,
   assignmentsByInstitution,
   getAssignmentById,
}: ResolveAssignmentIdParams) {
   const firstAssignmentId = assignmentsByInstitution[0]?.id ?? "";
   if (!candidateAssignmentId) return firstAssignmentId;

   const candidateAssignment = getAssignmentById(candidateAssignmentId);
   if (!candidateAssignment) return firstAssignmentId;
   if (candidateAssignment.institutionId !== institutionId) return firstAssignmentId;

   return candidateAssignmentId;
}
