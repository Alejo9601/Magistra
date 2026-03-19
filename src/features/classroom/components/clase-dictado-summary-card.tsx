import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassSession } from "@/types";

export function ClaseDictadoSummaryCard({
   cls,
   classTypeLabels,
   evaluativeFormatLabelMap,
}: {
   cls: ClassSession;
   classTypeLabels: Record<string, string>;
   evaluativeFormatLabelMap: Record<NonNullable<ClassSession["evaluativeFormat"]>, string>;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Resumen de planificacion</CardTitle>
         </CardHeader>
         <CardContent className="pt-0 space-y-2">
            <p className="text-xs text-muted-foreground">
               <span className="font-semibold text-foreground">Eje principal:</span> {cls.topic}
            </p>
            <p className="text-xs text-muted-foreground">
               <span className="font-semibold text-foreground">Caracter:</span> {classTypeLabels[cls.type] ?? cls.type}
            </p>
            {(cls.type === "practica" || cls.type === "teorico-practica") && (
               <>
                  <p className="text-xs text-muted-foreground">
                     <span className="font-semibold text-foreground">Actividad:</span> {cls.practiceActivityName || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     <span className="font-semibold text-foreground">Descripcion:</span> {cls.practiceActivityDescription || "Sin descripcion"}
                  </p>
               </>
            )}
            {cls.type === "evaluacion" && (
               <>
                  <p className="text-xs text-muted-foreground">
                     <span className="font-semibold text-foreground">Evaluacion:</span> {cls.evaluationName || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     <span className="font-semibold text-foreground">Tipo:</span> {cls.evaluativeFormat ? evaluativeFormatLabelMap[cls.evaluativeFormat] : "Sin tipo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     <span className="font-semibold text-foreground">Descripcion:</span> {cls.evaluationDescription || "Sin descripcion"}
                  </p>
               </>
            )}
         </CardContent>
      </Card>
   );
}
