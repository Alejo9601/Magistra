import { createContext, useContext, useEffect, useState } from "react";
import type { TeacherProfile } from "@/types";
import {
   loadTeacherProfile,
   saveTeacherProfile,
} from "@/features/teacher/services/teacher-service";

type TeacherProfileInput = {
   name: string;
   lastName: string;
   email: string;
   avatar: string;
};

type TeacherContextValue = {
   teacherProfile: TeacherProfile;
   updateTeacherProfile: (patch: TeacherProfileInput) => void;
};

const TeacherContext = createContext<TeacherContextValue | null>(null);

export function TeacherProvider({ children }: { children: React.ReactNode }) {
   const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(
      loadTeacherProfile,
   );

   useEffect(() => {
      saveTeacherProfile(teacherProfile);
   }, [teacherProfile]);

   const value: TeacherContextValue = {
      teacherProfile,
      updateTeacherProfile: (patch) => {
         setTeacherProfile({
            name: patch.name.trim(),
            lastName: patch.lastName.trim(),
            email: patch.email.trim(),
            avatar: patch.avatar.trim(),
         });
      },
   };

   return (
      <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>
   );
}

export function useTeacherContext() {
   const context = useContext(TeacherContext);
   if (!context) {
      throw new Error("useTeacherContext must be used within TeacherProvider.");
   }
   return context;
}
