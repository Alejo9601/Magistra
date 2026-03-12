import type { TeacherProfile } from "@/types";
import { defaultEduData } from "@/data/default-edu-data";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import { storageKeys } from "@/services/app-data-bootstrap-service";

function sanitizeTeacherProfile(raw: unknown): TeacherProfile | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const input = raw as Partial<TeacherProfile>;
   if (
      typeof input.name !== "string" ||
      typeof input.lastName !== "string" ||
      typeof input.email !== "string" ||
      typeof input.avatar !== "string"
   ) {
      return null;
   }

   return {
      name: input.name,
      lastName: input.lastName,
      email: input.email,
      avatar: input.avatar,
   };
}

export function loadTeacherProfile() {
   const seed = defaultEduData.teacherProfile as TeacherProfile;
   return readJsonFromStorage(storageKeys.teacherProfile, seed, (raw) =>
      sanitizeTeacherProfile(raw),
   );
}

export function saveTeacherProfile(profile: TeacherProfile) {
   writeJsonToStorage(storageKeys.teacherProfile, profile);
}
