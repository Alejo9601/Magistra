import { useInstitutionContext } from "@/features/institution";
import { useTeacherContext } from "@/features/teacher";
import {
   DashboardHero,
   QuickStats,
   PendingTasks,
   AtRiskStudents,
   TodayClasses,
   WeekTimeline,
} from "@/features/dashboard";

export function DashboardContent() {
   const { activeInstitution } = useInstitutionContext();
   const { teacherProfile } = useTeacherContext();
   const today = new Date();
   const formattedDate = today.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
   });

   return (
      <div className="p-6 max-w-7xl mx-auto">
         <DashboardHero
            formattedDate={formattedDate}
            teacherName={teacherProfile.name}
         />

         <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">
               Estado operativo
            </h2>
            <QuickStats activeInstitution={activeInstitution} />
         </div>

         <div className="mt-6">
            <TodayClasses activeInstitution={activeInstitution} />
         </div>

         <div className="mt-6">
            <WeekTimeline activeInstitution={activeInstitution} />
         </div>

         <div className="mt-6">
            <PendingTasks activeInstitution={activeInstitution} />
         </div>

         <div className="mt-6">
            <AtRiskStudents activeInstitution={activeInstitution} />
         </div>
      </div>
   );
}
