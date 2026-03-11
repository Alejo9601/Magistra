import { Badge } from "@/components/ui/badge";

type ClassStatus = "planificada" | "sin-planificar" | "finalizada";

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
   switch (status) {
      case "planificada":
         return (
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5">
               Planificada
            </Badge>
         );
      case "sin-planificar":
         return (
            <Badge className="bg-warning/10 text-warning-foreground border-0 text-[10px] px-1.5">
               Sin planificar
            </Badge>
         );
      case "finalizada":
         return (
            <Badge className="bg-success/10 text-success border-0 text-[10px] px-1.5">
               Finalizada
            </Badge>
         );
      default:
         return null;
   }
}

