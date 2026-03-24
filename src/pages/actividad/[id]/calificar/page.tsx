import { AppShell } from "@/components/app-shell";
import { ActivityGradingContent } from "@/features/activities";

export default function ActivityGradingPage() {
   return (
      <AppShell title="Calificar Actividad">
         <ActivityGradingContent />
      </AppShell>
   );
}
