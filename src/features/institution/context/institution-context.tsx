import { createContext, useContext, useEffect, useState } from "react";
import {
   loadActiveInstitution,
   saveActiveInstitution,
} from "@/features/institution/services/institution-service";

type InstitutionContextValue = {
   activeInstitution: string;
   setActiveInstitution: (institutionId: string) => void;
};

const InstitutionContext = createContext<InstitutionContextValue | null>(null);

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
   const [activeInstitution, setActiveInstitution] = useState(loadActiveInstitution);

   useEffect(() => {
      saveActiveInstitution(activeInstitution);
   }, [activeInstitution]);

   const value: InstitutionContextValue = { activeInstitution, setActiveInstitution };

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


