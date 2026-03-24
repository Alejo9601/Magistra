import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ClassNotesCard({
   notes,
   onChange,
   onSave,
   lockedMessage,
}: {
   notes: string;
   onChange: (value: string) => void;
   onSave: () => void;
   lockedMessage?: string;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notas de la clase</CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {lockedMessage ? (
               <div className="flex min-h-[136px] items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/25 px-3 text-center">
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                     <Info className="size-3.5" />
                     {lockedMessage}
                  </p>
               </div>
            ) : (
               <>
                  <Textarea
                     className="text-xs min-h-[100px] resize-none"
                     placeholder="Registra como resulto la clase vs lo planificado..."
                     value={notes}
                     onChange={(event) => onChange(event.target.value)}
                  />
                  <Button size="sm" className="mt-3 text-xs" onClick={onSave}>
                     Guardar notas
                  </Button>
               </>
            )}
         </CardContent>
      </Card>
   );
}
