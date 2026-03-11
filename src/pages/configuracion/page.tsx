import { AppShell } from "@/components/app-shell";
import { ConfiguracionContent } from "@/features/settings";

export default function ConfiguracionPage() {
   return (
      <AppShell title="Configuracion">
         <ConfiguracionContent />
      </AppShell>
   );
}
