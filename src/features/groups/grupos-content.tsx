import { useMemo, useState } from "react";
import { getAssignmentsByInstitution } from "@/lib/edu-repository";
import { useInstitutionContext } from "@/features/institution";
import { GroupsList } from "@/features/groups/containers/groups-list";
import { GroupDetail } from "@/features/groups/group-detail";

export function GruposContent() {
   const { activeInstitution } = useInstitutionContext();
   const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
   const validAssignmentIds = useMemo(
      () => new Set(getAssignmentsByInstitution(activeInstitution).map((a) => a.id)),
      [activeInstitution],
   );

   const effectiveSelectedGroup =
      selectedGroup && validAssignmentIds.has(selectedGroup)
         ? selectedGroup
         : null;

   if (effectiveSelectedGroup) {
      return (
         <GroupDetail
            assignmentId={effectiveSelectedGroup}
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
