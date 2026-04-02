import { AppShell } from "@/components/app-shell";
import { ClassDetailContent } from "@/features/classroom";

export default function ClassDetailPage() {
   return (
      <AppShell title="Class Detail">
         <ClassDetailContent />
      </AppShell>
   );
}
