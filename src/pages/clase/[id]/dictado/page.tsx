import { AppShell } from "@/components/app-shell";
import { ClaseDictadoContent } from "@/components/clase-dictado";

export default function ClaseDictadoPage() {
   return (
      <AppShell title="Dictado en Clase">
         <ClaseDictadoContent />
      </AppShell>
   );
}
