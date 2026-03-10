import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { classSessions } from "@/lib/edu-repository";

const ACTIVITIES_STORAGE_KEY = "aula.activities";

export type ActivityType = "classwork" | "homework" | "lab" | "project";
export type ActivityStatus = "draft" | "planned" | "assigned" | "completed";

export type SubjectActivity = {
   id: string;
   subjectId: string;
   title: string;
   description?: string;
   type: ActivityType;
   status: ActivityStatus;
   linkedClassIds: string[];
};

type NewActivityInput = {
   subjectId: string;
   title: string;
   description?: string;
   type?: ActivityType;
   status?: ActivityStatus;
   linkedClassIds?: string[];
};

type UpdateActivityInput = {
   title?: string;
   description?: string;
   type?: ActivityType;
   status?: ActivityStatus;
   linkedClassIds?: string[];
};

type ActivitiesContextValue = {
   activities: SubjectActivity[];
   getActivitiesBySubject: (subjectId: string) => SubjectActivity[];
   addActivity: (input: NewActivityInput) => SubjectActivity;
   updateActivity: (id: string, patch: UpdateActivityInput) => void;
   removeActivity: (id: string) => void;
   toggleActivityLink: (activityId: string, classId: string) => void;
};

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

function isActivityType(value: unknown): value is ActivityType {
   return (
      value === "classwork" ||
      value === "homework" ||
      value === "lab" ||
      value === "project"
   );
}

function isActivityStatus(value: unknown): value is ActivityStatus {
   return (
      value === "draft" ||
      value === "planned" ||
      value === "assigned" ||
      value === "completed"
   );
}

function sanitizeActivity(raw: unknown): SubjectActivity | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<SubjectActivity>;
   if (
      typeof input.id !== "string" ||
      typeof input.subjectId !== "string" ||
      typeof input.title !== "string" ||
      !isActivityType(input.type) ||
      !isActivityStatus(input.status) ||
      !Array.isArray(input.linkedClassIds)
   ) {
      return null;
   }

   return {
      id: input.id,
      subjectId: input.subjectId,
      title: input.title,
      description:
         typeof input.description === "string" ? input.description : undefined,
      type: input.type,
      status: input.status,
      linkedClassIds: input.linkedClassIds.filter(
         (id): id is string => typeof id === "string",
      ),
   };
}

function parseActivityLines(source?: string) {
   if (!source) {
      return [];
   }
   const parts = source
      .split(/\r?\n|[.;]/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
   return Array.from(new Set(parts));
}

function seedActivities(): SubjectActivity[] {
   const grouped = new Map<string, { subjectId: string; linkedClassIds: string[] }>();
   classSessions.forEach((classSession) => {
      parseActivityLines(classSession.activities).forEach((title) => {
         const key = `${classSession.subjectId}|${title.toLowerCase()}`;
         const current = grouped.get(key);
         if (current) {
            if (!current.linkedClassIds.includes(classSession.id)) {
               current.linkedClassIds.push(classSession.id);
            }
            return;
         }
         grouped.set(key, {
            subjectId: classSession.subjectId,
            linkedClassIds: [classSession.id],
         });
      });
   });

   return Array.from(grouped.entries()).map(([key, entry], index) => {
      const [, titleKey] = key.split("|");
      return {
         id: `act-seed-${index + 1}`,
         subjectId: entry.subjectId,
         title: titleKey
            .split(" ")
            .map((chunk) =>
               chunk.length > 0
                  ? `${chunk[0].toUpperCase()}${chunk.slice(1)}`
                  : chunk,
            )
            .join(" "),
         type: "classwork",
         status: "planned",
         linkedClassIds: entry.linkedClassIds,
      } satisfies SubjectActivity;
   });
}

function resolveInitialActivities() {
   if (typeof window === "undefined") {
      return seedActivities();
   }
   const persisted = window.localStorage.getItem(ACTIVITIES_STORAGE_KEY);
   if (!persisted) {
      return seedActivities();
   }
   try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) {
         return seedActivities();
      }
      const sanitized = parsed
         .map((entry) => sanitizeActivity(entry))
         .filter((entry): entry is SubjectActivity => entry !== null);
      return sanitized.length > 0 ? sanitized : seedActivities();
   } catch {
      return seedActivities();
   }
}

function createActivityId() {
   return `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
   const [activities, setActivities] = useState<SubjectActivity[]>(
      resolveInitialActivities,
   );

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      window.localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
   }, [activities]);

   const value = useMemo<ActivitiesContextValue>(
      () => ({
         activities,
         getActivitiesBySubject: (subjectId) =>
            activities.filter((activity) => activity.subjectId === subjectId),
         addActivity: (input) => {
            const nextActivity: SubjectActivity = {
               id: createActivityId(),
               subjectId: input.subjectId,
               title: input.title.trim(),
               description: input.description?.trim() || undefined,
               type: input.type ?? "classwork",
               status: input.status ?? "draft",
               linkedClassIds: input.linkedClassIds ?? [],
            };
            setActivities((prev) => [...prev, nextActivity]);
            return nextActivity;
         },
         updateActivity: (id, patch) => {
            setActivities((prev) =>
               prev.map((activity) =>
                  activity.id === id
                     ? {
                          ...activity,
                          ...patch,
                          title: patch.title?.trim() ?? activity.title,
                          description:
                             patch.description === undefined
                                ? activity.description
                                : patch.description.trim() || undefined,
                       }
                     : activity,
               ),
            );
         },
         removeActivity: (id) => {
            setActivities((prev) => prev.filter((activity) => activity.id !== id));
         },
         toggleActivityLink: (activityId, classId) => {
            setActivities((prev) =>
               prev.map((activity) => {
                  if (activity.id !== activityId) {
                     return activity;
                  }
                  const isLinked = activity.linkedClassIds.includes(classId);
                  return {
                     ...activity,
                     linkedClassIds: isLinked
                        ? activity.linkedClassIds.filter((id) => id !== classId)
                        : [...activity.linkedClassIds, classId],
                  };
               }),
            );
         },
      }),
      [activities],
   );

   return (
      <ActivitiesContext.Provider value={value}>
         {children}
      </ActivitiesContext.Provider>
   );
}

export function useActivitiesContext() {
   const context = useContext(ActivitiesContext);
   if (!context) {
      throw new Error("useActivitiesContext must be used within ActivitiesProvider.");
   }
   return context;
}
