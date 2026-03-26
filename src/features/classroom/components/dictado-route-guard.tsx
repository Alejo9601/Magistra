import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { usePlanningContext } from "@/features/planning";

export function DictadoRouteGuard({ children }: { children: ReactNode }) {
   const params = useParams();
   const classId = params.id;
   const { classes } = usePlanningContext();

   const cls = classes.find((classSession) => classSession.id === classId);

   if (cls?.status === "sin_planificar" && classId) {
      return <Navigate to={`/clase/${classId}`} replace />;
   }

   return <>{children}</>;
}
