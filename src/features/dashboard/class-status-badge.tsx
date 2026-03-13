import { Badge } from "@/components/ui/badge";

type ClassStatus = "planificada" | "sin-planificar" | "finalizada";

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
   switch (status) {
      case "planificada":
         return (
            <Badge variant="outline" className="status-ok border-0 text-[10px] px-1.5">
               Planificada
            </Badge>
         );
      case "sin-planificar":
         return (
            <Badge variant="outline" className="status-warning border-0 text-[10px] px-1.5">
               Sin planificar
            </Badge>
         );
      case "finalizada":
         return (
            <Badge variant="outline" className="status-ok border-0 text-[10px] px-1.5">
               Finalizada
            </Badge>
         );
      default:
         return null;
   }
}

