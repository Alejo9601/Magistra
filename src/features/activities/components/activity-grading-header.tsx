import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ActivityGradingHeaderProps = {
   title: string;
   courseLabel: string;
   progressLabel: string;
   onBack: () => void;
};

export function ActivityGradingHeader({
   title,
   courseLabel,
   progressLabel,
   onBack,
}: ActivityGradingHeaderProps) {
   return (
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
         <div className="flex items-start gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
               <ArrowLeft className="size-4" />
            </Button>
            <div>
               <h2 className="text-base font-semibold text-foreground">Calificacion de actividad</h2>
               <p className="text-xs text-muted-foreground">{title}</p>
               <p className="text-xs text-muted-foreground">{courseLabel}</p>
            </div>
         </div>
         <Badge variant="secondary" className="border-0 bg-primary/10 text-primary text-xs">
            {progressLabel}
         </Badge>
      </div>
   );
}
