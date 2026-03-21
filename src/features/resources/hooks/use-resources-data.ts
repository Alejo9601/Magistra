import { useMemo } from "react";
import { matchesInstitutionScope } from "@/features/institution";
import type { ContentItem } from "@/types";

type UseResourcesDataParams = {
   contentItems: ContentItem[];
   activeInstitution: string;
   search: string;
   filterType: string;
};

export function useResourcesData({
   contentItems,
   activeInstitution,
   search,
   filterType,
}: UseResourcesDataParams) {
   const filtered = useMemo(() => {
      const normalizedSearch = search.toLowerCase();

      return contentItems.filter((item) => {
         const matchesSearch =
            item.name.toLowerCase().includes(normalizedSearch) ||
            item.description.toLowerCase().includes(normalizedSearch);
         const matchesInstitution = matchesInstitutionScope(item.institutionId, activeInstitution);
         const matchesType = filterType === "all" || item.type === filterType;
         return matchesSearch && matchesInstitution && matchesType;
      });
   }, [activeInstitution, contentItems, filterType, search]);

   return { filtered };
}


