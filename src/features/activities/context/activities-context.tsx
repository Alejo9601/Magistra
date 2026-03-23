import { createContext, useContext, useEffect, useState } from "react";
import {
   createActivityId,
   loadActivities,
   saveActivities,
} from "@/features/activities/services/activities-service";
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
} from "@/lib/edu-repository";
import type { ActivityStatus, ActivityType, SubjectActivity } from "@/types";

export type { ActivityStatus, ActivityType, SubjectActivity };

type NewActivityInput = {
   assignmentId: string;
   title: string;
   description?: string;
   type?: ActivityType;
   status?: ActivityStatus;
   esEvaluable?: boolean;
   rubricaId?: string;
   fechaInicio?: string;
   fechaFin?: string;
   linkedClassIds?: string[];
};

type UpdateActivityInput = {
   assignmentId?: string;
   title?: string;
   description?: string;
   type?: ActivityType;
   status?: ActivityStatus;
   esEvaluable?: boolean;
   rubricaId?: string;
   fechaInicio?: string;
   fechaFin?: string;
   linkedClassIds?: string[];
};

type ActivitiesContextValue = {
   activities: SubjectActivity[];
   getActivitiesBySubject: (subjectId: string) => SubjectActivity[];
   getActivitiesByAssignment: (assignmentId: string) => SubjectActivity[];
   addActivity: (input: NewActivityInput) => SubjectActivity;
   updateActivity: (id: string, patch: UpdateActivityInput) => void;
   removeActivity: (id: string) => void;
   removeActivitiesByAssignment: (assignmentId: string) => void;
   toggleActivityLink: (activityId: string, classId: string) => void;
};

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

export function ActivitiesProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [activities, setActivities] =
      useState<SubjectActivity[]>(loadActivities);

   useEffect(() => {
      saveActivities(activities);
   }, [activities]);

   const value: ActivitiesContextValue = {
      activities,
      getActivitiesBySubject: (subjectId) =>
         activities.filter((activity) => activity.subjectId === subjectId),
      getActivitiesByAssignment: (assignmentId) =>
         activities.filter(
            (activity) =>
               (activity.assignmentId ??
                  getAssignmentIdBySubjectId(activity.subjectId)) ===
               assignmentId,
         ),
      addActivity: (input) => {
         const assignment = getAssignmentById(input.assignmentId);
         if (!assignment) {
            throw new Error("Assignment not found for activity creation.");
         }
         const today = new Date().toISOString().slice(0, 10);
         const nextActivity: SubjectActivity = {
            id: createActivityId(),
            subjectId: assignment.subjectId,
            assignmentId: assignment.id,
            title: input.title.trim(),
            description: input.description?.trim() || undefined,
            type: input.type ?? "practica",
            esEvaluable: input.esEvaluable ?? (input.type === "examen"),
            rubricaId: input.rubricaId?.trim() || undefined,
            fechaInicio: input.fechaInicio ?? today,
            fechaFin: input.fechaFin,
            status: input.status ?? "draft",
            linkedClassIds: input.linkedClassIds ?? [],
         };
         setActivities((prev) => [...prev, nextActivity]);
         return nextActivity;
      },
      updateActivity: (id, patch) => {
         const assignment = patch.assignmentId
            ? getAssignmentById(patch.assignmentId)
            : null;
         setActivities((prev) =>
            prev.map((activity) =>
               activity.id === id
                  ? {
                       ...activity,
                       ...patch,
                       subjectId: assignment?.subjectId ?? activity.subjectId,
                       assignmentId: assignment?.id ?? activity.assignmentId,
                       title: patch.title?.trim() ?? activity.title,
                       description:
                          patch.description === undefined
                             ? activity.description
                             : patch.description.trim() || undefined,
                       rubricaId:
                          patch.rubricaId === undefined
                             ? activity.rubricaId
                             : patch.rubricaId.trim() || undefined,
                    }
                  : activity,
            ),
         );
      },
      removeActivity: (id) => {
         setActivities((prev) => prev.filter((activity) => activity.id !== id));
      },
      removeActivitiesByAssignment: (assignmentId) => {
         setActivities((prev) =>
            prev.filter(
               (activity) =>
                  (activity.assignmentId ??
                     getAssignmentIdBySubjectId(activity.subjectId)) !==
                  assignmentId,
            ),
         );
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
   };

   return (
      <ActivitiesContext.Provider value={value}>
         {children}
      </ActivitiesContext.Provider>
   );
}

export function useActivitiesContext() {
   const context = useContext(ActivitiesContext);
   if (!context) {
      throw new Error(
         "useActivitiesContext must be used within ActivitiesProvider.",
      );
   }
   return context;
}
