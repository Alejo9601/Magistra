import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import { getAssignmentIdBySubjectId } from "@/lib/edu-repository";

export function TeachingRouteGuard({ children }: { children: ReactNode }) {
   const params = useParams();
   const classId = params.id;
   const { classes } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();

   const cls = classes.find((classSession) => classSession.id === classId);
   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];

   if (cls?.status === "sin_planificar" && classId) {
      return <Navigate to={`/clase/${classId}`} replace />;
   }
   if (cls && classStudents.length === 0 && classId) {
      return <Navigate to={`/clase/${classId}`} replace />;
   }

   return <>{children}</>;
}
