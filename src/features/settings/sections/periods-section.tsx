import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { institutions } from "@/lib/edu-repository";
import { toast } from "sonner";

export function PeriodsSection() {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <CalendarDays className="size-4" />
               Periodos lectivos
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {institutions.map((inst) => (
               <div
                  key={inst.id}
                  className="flex items-center gap-4 py-2.5 border-b border-border last:border-0"
               >
                  <div
                     className="size-3 rounded-full"
                     style={{ backgroundColor: inst.color }}
                  />
                  <div className="flex-1">
                     <p className="text-xs font-medium text-foreground">
                        {inst.name}
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Input
                        className="h-8 w-28 text-xs"
                        type="date"
                        defaultValue="2026-03-01"
                     />
                     <span className="text-xs text-muted-foreground">a</span>
                     <Input
                        className="h-8 w-28 text-xs"
                        type="date"
                        defaultValue="2026-12-15"
                     />
                  </div>
               </div>
            ))}
            <Button
               size="sm"
               className="mt-3 text-xs"
               onClick={() => toast.success("Periodos guardados")}
            >
               Guardar periodos
            </Button>
         </CardContent>
      </Card>
   );
}
