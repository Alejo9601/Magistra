import { AppShell } from "@/components/app-shell";
import { PlanificacionContent } from "@/features/planning";

export default function PlanificacionPage() {
   return (
      <AppShell title="Planificacion">
         <PlanificacionContent />
      </AppShell>
   );
}
