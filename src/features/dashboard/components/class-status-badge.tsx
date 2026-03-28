import { Badge } from "@/components/ui/badge";

type ClassStatus = "planificada" | "sin_planificar" | "en_curso" | "dictada";

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
   switch (status) {
      case "sin_planificar":
         return (
            <Badge variant="outline" className="border-0 bg-warning/15 text-warning-foreground text-[10px] px-1.5">
               Sin planificar
            </Badge>
         );
      case "planificada":
         return (
            <Badge variant="outline" className="border-0 bg-primary/12 text-primary text-[10px] px-1.5">
               Planificada
            </Badge>
         );
      case "en_curso":
         return (
            <Badge variant="outline" className="border-0 bg-warning/15 text-warning-foreground text-[10px] px-1.5">
               En curso
            </Badge>
         );
      case "dictada":
         return (
            <Badge variant="outline" className="border-0 bg-success/12 text-success text-[10px] px-1.5">
               Dictada
            </Badge>
         );
      default:
         return null;
   }
}
