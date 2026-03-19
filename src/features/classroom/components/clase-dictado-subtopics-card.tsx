import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function ClaseDictadoSubtopicsCard({
   subtopics,
   completedSubtopics,
   addingSubtopic,
   newSubtopic,
   isFinalized,
   onToggleAdd,
   onNewSubtopicChange,
   onAddSubtopic,
   onToggleSubtopic,
}: {
   subtopics: string[];
   completedSubtopics: string[];
   addingSubtopic: boolean;
   newSubtopic: string;
   isFinalized: boolean;
   onToggleAdd: () => void;
   onNewSubtopicChange: (value: string) => void;
   onAddSubtopic: () => void;
   onToggleSubtopic: (subtopic: string) => void;
}) {
   const completedSubtopicsCount = subtopics.filter((subtopic) =>
      completedSubtopics.includes(subtopic),
   ).length;

   return (
      <Card>
         <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
               <CardTitle className="text-sm font-semibold">Subtemas dictados</CardTitle>
               <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                     {completedSubtopicsCount}/{subtopics.length}
                  </Badge>
                  <Button
                     variant="outline"
                     size="icon"
                     className="size-7"
                     onClick={onToggleAdd}
                     disabled={isFinalized}
                     title="Agregar subtema"
                  >
                     {addingSubtopic ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                  </Button>
               </div>
            </div>
         </CardHeader>
         <CardContent className="pt-0">
            {addingSubtopic && (
               <div className="mb-3 flex gap-2">
                  <Input
                     className="h-8 text-xs"
                     placeholder="Nuevo subtema..."
                     value={newSubtopic}
                     onChange={(event) => onNewSubtopicChange(event.target.value)}
                     disabled={isFinalized}
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={onAddSubtopic} disabled={isFinalized}>
                     Agregar
                  </Button>
               </div>
            )}
            {subtopics.length === 0 ? (
               <p className="text-xs text-muted-foreground">Esta clase no tiene subtemas cargados.</p>
            ) : (
               <div className="space-y-2">
                  {subtopics.map((subtopic) => (
                     <label key={subtopic} className="flex items-start gap-2.5 cursor-pointer">
                        <Checkbox
                           checked={completedSubtopics.includes(subtopic)}
                           onCheckedChange={() => !isFinalized && onToggleSubtopic(subtopic)}
                           disabled={isFinalized}
                        />
                        <span className="text-xs text-foreground">{subtopic}</span>
                     </label>
                  ))}
               </div>
            )}
         </CardContent>
      </Card>
   );
}
