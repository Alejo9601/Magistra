import { institutions } from "@/lib/edu-repository";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import { storageKeys } from "@/services/app-data-bootstrap-service";

export const ALL_INSTITUTIONS_VALUE = "all";

export function isAllInstitutionsScope(institutionId: string) {
   return institutionId === ALL_INSTITUTIONS_VALUE;
}

export function matchesInstitutionScope(
   itemInstitutionId: string,
   activeInstitution: string,
) {
   return isAllInstitutionsScope(activeInstitution) || itemInstitutionId === activeInstitution;
}

export function loadActiveInstitution() {
   const fallbackInstitution = institutions[0]?.id ?? "inst-1";
   return readJsonFromStorage(
      storageKeys.activeInstitution,
      fallbackInstitution,
      (raw) => {
         if (typeof raw !== "string") {
            return null;
         }
         if (isAllInstitutionsScope(raw)) {
            return raw;
         }
         return institutions.some((institution) => institution.id === raw)
            ? raw
            : fallbackInstitution;
      },
   );
}

export function saveActiveInstitution(institutionId: string) {
   writeJsonToStorage(storageKeys.activeInstitution, institutionId);
}
