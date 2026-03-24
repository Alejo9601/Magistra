import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ClaseDictadoHeader({
   subjectName,
   classDateLabel,
   classTime,
   course,
   isFinalized,
   onBack,
   onReopenClass,
   onCloseClass,
}: {
   subjectName: string;
   classDateLabel: string;
   classTime: string;
   course: string;
   isFinalized: boolean;
   onBack: () => void;
   onReopenClass: () => void;
   onCloseClass: () => void;
}) {
   return (
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
               <ArrowLeft className="size-4" />
            </Button>
            <div className="space-y-1">
               {isFinalized ? (
                  <Badge variant="secondary" className="w-fit border-0 bg-success/10 text-success">
                     Dictada
                  </Badge>
               ) : null}
               <p className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
                  {subjectName}
               </p>
               <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
                     {classDateLabel}
                  </Badge>
                  <Badge variant="secondary" className="border-0 bg-muted text-foreground">
                     {classTime} hs
                  </Badge>
                  <span className="text-muted-foreground">{course}</span>
               </div>
            </div>
         </div>
         {isFinalized ? (
            <Button size="sm" variant="outline" className="text-xs" onClick={onReopenClass}>
               Reabrir clase
            </Button>
         ) : (
            <Button size="sm" className="text-xs" onClick={onCloseClass}>
               <CheckCircle2 className="size-3.5 mr-1.5" />
               Finalizar clase
            </Button>
         )}
      </div>
   );
}
