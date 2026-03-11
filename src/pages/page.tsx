import { AppShell } from "@/components/app-shell";
import { DashboardContent } from "@/features/dashboard";

export default function HomePage() {
   return (
      <AppShell title="Dashboard">
         <DashboardContent />
      </AppShell>
   );
}
