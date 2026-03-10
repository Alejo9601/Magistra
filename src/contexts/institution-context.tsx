import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { institutions } from "@/lib/edu-repository";

export const ACTIVE_INSTITUTION_STORAGE_KEY = "aula.activeInstitution";

type InstitutionContextValue = {
   activeInstitution: string;
   setActiveInstitution: (institutionId: string) => void;
};

const InstitutionContext = createContext<InstitutionContextValue | null>(null);

function resolveInitialInstitution() {
   const fallbackInstitution = institutions[0]?.id ?? "inst-1";

   if (typeof window === "undefined") {
      return fallbackInstitution;
   }

   const savedInstitution = window.localStorage.getItem(
      ACTIVE_INSTITUTION_STORAGE_KEY,
   );

   if (
      savedInstitution &&
      institutions.some((institution) => institution.id === savedInstitution)
   ) {
      return savedInstitution;
   }

   return fallbackInstitution;
}

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
   const [activeInstitution, setActiveInstitution] = useState(
      resolveInitialInstitution,
   );

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }

      window.localStorage.setItem(
         ACTIVE_INSTITUTION_STORAGE_KEY,
         activeInstitution,
      );
   }, [activeInstitution]);

   const value = useMemo(
      () => ({ activeInstitution, setActiveInstitution }),
      [activeInstitution],
   );

   return (
      <InstitutionContext.Provider value={value}>
         {children}
      </InstitutionContext.Provider>
   );
}

export function useInstitutionContext() {
   const context = useContext(InstitutionContext);
   if (!context) {
      throw new Error(
         "useInstitutionContext must be used within InstitutionProvider.",
      );
   }
   return context;
}
