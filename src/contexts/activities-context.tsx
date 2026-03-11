import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
   createActivityId,
   loadActivities,
   saveActivities,
} from "@/services/activities-service";
import type { ActivityStatus, ActivityType, SubjectActivity } from "@/types";

export type { ActivityStatus, ActivityType, SubjectActivity };

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

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
   const [activities, setActivities] = useState<SubjectActivity[]>(loadActivities);

   useEffect(() => {
      saveActivities(activities);
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
