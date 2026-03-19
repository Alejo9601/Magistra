import { Badge } from "@/components/ui/badge";

export function StudentStatusBadge({ status }: { status: string }) {
   switch (status) {
      case "destacado":
         return (
            <Badge className="bg-success/10 text-success border-0 text-[10px]">
               Destacado
            </Badge>
         );
      case "en-riesgo":
         return (
            <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">
               En riesgo
            </Badge>
         );
      case "regular":
         return (
            <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
               Regular
            </Badge>
         );
      default:
         return null;
   }
}
