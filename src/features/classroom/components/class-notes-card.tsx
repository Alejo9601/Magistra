import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ClassNotesCard({
   notes,
   onChange,
   onSave,
}: {
   notes: string;
   onChange: (value: string) => void;
   onSave: () => void;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notas de la clase</CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <Textarea
               className="text-xs min-h-[100px] resize-none"
               placeholder="Registra como resulto la clase vs lo planificado..."
               value={notes}
               onChange={(event) => onChange(event.target.value)}
            />
            <Button size="sm" className="mt-3 text-xs" onClick={onSave}>
               Guardar notas
            </Button>
         </CardContent>
      </Card>
   );
}
