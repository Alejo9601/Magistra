import { AppShell } from "@/components/app-shell";
import { DashboardContent } from "@/components/dashboard";

export default function HomePage() {
   return (
      <AppShell title="Dashboard">
         <DashboardContent />
      </AppShell>
   );
}
