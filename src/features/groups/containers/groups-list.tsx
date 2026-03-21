import {
   getAssignmentsByInstitution,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import { GroupsListView } from "@/features/groups/components";

export function GroupsList({
   onSelect,
   onAddSubject,
   activeInstitution,
}: {
   onSelect: (assignmentId: string) => void;
   onAddSubject: () => void;
   activeInstitution: string;
}) {
   const groups = getAssignmentsByInstitution(activeInstitution)
      .map((assignment) => {
         const subject = getSubjectById(assignment.subjectId);
         if (!subject) {
            return null;
         }
         const institution = getInstitutionById(assignment.institutionId);
         return {
            id: assignment.id,
            name: subject.name,
            course: assignment.section,
            studentCount: subject.studentCount,
            planProgress: subject.planProgress,
            institutionName: institution?.name ?? "Institucion",
            institutionColor: institution?.color ?? "#64748b",
         };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);

   return <GroupsListView groups={groups} onSelect={onSelect} onAddSubject={onAddSubject} />;
}
