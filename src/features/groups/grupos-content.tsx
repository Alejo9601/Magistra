import { useMemo, useState } from "react";
import { subjects } from "@/lib/edu-repository";
import { useInstitutionContext } from "@/features/institution";
import { GroupsList } from "@/features/groups/containers/groups-list";
import { GroupDetail } from "@/features/groups/group-detail";

export function GruposContent() {
   const { activeInstitution } = useInstitutionContext();
   const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
   const validSubjectIds = useMemo(
      () =>
         new Set(
            subjects
               .filter((subject) => subject.institutionId === activeInstitution)
               .map((subject) => subject.id),
         ),
      [activeInstitution],
   );

   const effectiveSelectedGroup =
      selectedGroup && validSubjectIds.has(selectedGroup)
         ? selectedGroup
         : null;

   if (effectiveSelectedGroup) {
      return (
         <GroupDetail
            subjectId={effectiveSelectedGroup}
            onBack={() => setSelectedGroup(null)}
         />
      );
   }

   return (
      <GroupsList
         onSelect={setSelectedGroup}
         activeInstitution={activeInstitution}
      />
   );
}

