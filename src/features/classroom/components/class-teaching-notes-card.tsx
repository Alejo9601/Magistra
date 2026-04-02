import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ClassTeachingNotesCard({
   notes,
   isFinalized,
   onNotesChange,
}: {
   notes: string;
   isFinalized: boolean;
   onNotesChange: (value: string) => void;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Observaciones de dictado</CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <Label className="sr-only">Observaciones</Label>
            <Textarea
               className="text-xs min-h-[100px] resize-none"
               placeholder="Que salio bien, que ajustar para la proxima clase, incidencias..."
               value={notes}
               onChange={(event) => onNotesChange(event.target.value)}
               disabled={isFinalized}
            />
         </CardContent>
      </Card>
   );
}
