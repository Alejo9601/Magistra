import { getInstitutionById, subjects } from "@/lib/edu-repository";
import { GroupsListView } from "@/features/groups/components/groups-list-view";

export function GroupsList({
   onSelect,
   activeInstitution,
}: {
   onSelect: (subjectId: string) => void;
   activeInstitution: string;
}) {
   const groups = subjects
      .filter((subject) => subject.institutionId === activeInstitution)
      .map((subject) => {
         const institution = getInstitutionById(subject.institutionId);
         return {
            id: subject.id,
            name: subject.name,
            course: subject.course,
            studentCount: subject.studentCount,
            planProgress: subject.planProgress,
            institutionName: institution?.name ?? "Institucion",
            institutionColor: institution?.color ?? "#64748b",
         };
      });

   return <GroupsListView groups={groups} onSelect={onSelect} />;
}
