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

         <QuickStats activeInstitution={activeInstitution} />

         <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <PendingTasks activeInstitution={activeInstitution} />
            </div>
            <div>
               <AtRiskStudents activeInstitution={activeInstitution} />
            </div>
         </div>

         <div className="mt-6 grid grid-cols-1 gap-6">
            <TodayClasses activeInstitution={activeInstitution} />
            <WeekTimeline activeInstitution={activeInstitution} />
         </div>
      </div>
   );
}
