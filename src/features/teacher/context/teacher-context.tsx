import { createContext, useContext, useEffect, useState } from "react";
import type { TeacherProfile } from "@/types";
import {
   loadTeacherProfile,
   saveTeacherProfile,
} from "@/features/teacher/services/teacher-service";
import { storageKeys } from "@/services/app-data-bootstrap-service";

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

function buildAvatar(name: string, lastName: string) {
   const first = name.trim().charAt(0).toUpperCase();
   const last = lastName.trim().charAt(0).toUpperCase();
   return `${first}${last}`.trim();
}

export function TeacherProvider({ children }: { children: React.ReactNode }) {
   const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(
      loadTeacherProfile,
   );

   useEffect(() => {
      // Rehydrate from storage on mount to avoid stale sidebar/profile data.
      setTeacherProfile(loadTeacherProfile());
   }, []);

   useEffect(() => {
      saveTeacherProfile(teacherProfile);
   }, [teacherProfile]);

   useEffect(() => {
      const onStorage = (event: StorageEvent) => {
         if (event.key === storageKeys.teacherProfile) {
            setTeacherProfile(loadTeacherProfile());
         }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
   }, []);

   const value: TeacherContextValue = {
      teacherProfile,
      updateTeacherProfile: (patch) => {
         const name = patch.name.trim();
         const lastName = patch.lastName.trim();
         const email = patch.email.trim();
         const avatar = patch.avatar.trim() || buildAvatar(name, lastName);

         setTeacherProfile({
            name,
            lastName,
            email,
            avatar,
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
