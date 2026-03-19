import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TodayAlert = {
   id: string;
   text: string;
   severity: "high" | "medium";
   priority: number;
   actionTo?: string;
   actionLabel?: string;
};

export function TodayClassesAlertsCard({
   alerts,
}: {
   alerts: TodayAlert[];
}) {
   return (
      <Card className="app-panel">
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <AlertTriangle className="size-4 text-warning-foreground" />
               Alertas criticas
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {alerts.length === 0 ? (
               <p className="text-xs text-muted-foreground">
                  Sin alertas criticas por ahora.
               </p>
            ) : (
               <div className="max-h-[205px] overflow-y-auto pr-1 space-y-2">
                  {alerts.map((alert) => (
                     <div key={alert.id} className="rounded-md border border-border/70 p-2">
                        <p className="break-words text-xs text-foreground">{alert.text}</p>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                           <Badge
                              variant="outline"
                              className={`border-0 text-[10px] ${
                                 alert.severity === "high" ? "alert-high" : "alert-medium"
                              }`}
                           >
                              {alert.severity === "high" ? "Alta" : "Media"}
                           </Badge>
                           {alert.actionTo && alert.actionLabel && (
                              <Button asChild variant="link" className="h-auto p-0 text-[11px]">
                                 <Link to={alert.actionTo}>{alert.actionLabel}</Link>
                              </Button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </CardContent>
      </Card>
   );
}
