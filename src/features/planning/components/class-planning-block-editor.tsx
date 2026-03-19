import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClassBlock, ClassSession } from "@/types";

type ClassCharacterOption = {
   value: ClassSession["type"];
   label: string;
};

type EvaluativeFormatOption = {
   value: NonNullable<ClassSession["evaluativeFormat"]>;
   label: string;
};

type Props = {
   block: ClassBlock;
   planBlocksSeparately: boolean;
   classCharacterOptions: ClassCharacterOption[];
   evaluativeFormatOptions: EvaluativeFormatOption[];
   onUpdateBlock: (order: number, updates: Partial<ClassBlock>) => void;
};

export function ClassPlanningBlockEditor({
   block,
   planBlocksSeparately,
   classCharacterOptions,
   evaluativeFormatOptions,
   onUpdateBlock,
}: Props) {
   return (
      <div
         className={
            planBlocksSeparately
               ? "rounded-md border border-border/50 p-3 space-y-2"
               : "space-y-2"
         }
      >
         <p className="text-xs font-semibold text-foreground">
            {planBlocksSeparately ? `Bloque ${block.order}` : "Planificacion de la clase"}
         </p>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
               <Label className="text-xs">Eje principal / Tema principal</Label>
               <Input
                  className="h-9 text-xs"
                  value={block.topic}
                  onChange={(event) =>
                     onUpdateBlock(block.order, { topic: event.target.value })
                  }
               />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
               <Label className="text-xs">Subtemas (uno por linea)</Label>
               <Textarea
                  className="text-xs min-h-[70px] resize-none"
                  value={block.subtopics.join("\n")}
                  onChange={(event) =>
                     onUpdateBlock(block.order, {
                        subtopics: event.target.value
                           .split("\n")
                           .map((value) => value.trim())
                           .filter(Boolean),
                     })
                  }
               />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
               <Label className="text-xs">Caracter de la clase</Label>
               <Select
                  value={block.type}
                  onValueChange={(value) => {
                     const nextType = value as Exclude<ClassSession["type"], "oral">;
                     onUpdateBlock(block.order, {
                        type: nextType,
                        evaluativeFormat:
                           nextType === "evaluacion"
                              ? block.evaluativeFormat
                              : undefined,
                        evaluationName:
                           nextType === "evaluacion"
                              ? block.evaluationName
                              : undefined,
                        evaluationDescription:
                           nextType === "evaluacion"
                              ? block.evaluationDescription
                              : undefined,
                        practiceActivityName:
                           nextType === "practica" || nextType === "teorico-practica"
                              ? block.practiceActivityName
                              : undefined,
                        practiceActivityDescription:
                           nextType === "practica" || nextType === "teorico-practica"
                              ? block.practiceActivityDescription
                              : undefined,
                     });
                  }}
               >
                  <SelectTrigger className="h-9 text-xs">
                     <SelectValue placeholder="Seleccionar caracter..." />
                  </SelectTrigger>
                  <SelectContent>
                     {classCharacterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            {(block.type === "practica" || block.type === "teorico-practica") && (
               <>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Nombre de la actividad</Label>
                     <Input
                        className="h-9 text-xs"
                        value={block.practiceActivityName ?? ""}
                        onChange={(event) =>
                           onUpdateBlock(block.order, {
                              practiceActivityName: event.target.value,
                           })
                        }
                     />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                     <Label className="text-xs">Descripcion</Label>
                     <Textarea
                        className="text-xs min-h-[70px] resize-none"
                        value={block.practiceActivityDescription ?? ""}
                        onChange={(event) =>
                           onUpdateBlock(block.order, {
                              practiceActivityDescription: event.target.value,
                           })
                        }
                     />
                  </div>
               </>
            )}

            {block.type === "evaluacion" && (
               <>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Nombre de la evaluacion</Label>
                     <Input
                        className="h-9 text-xs"
                        value={block.evaluationName ?? ""}
                        onChange={(event) =>
                           onUpdateBlock(block.order, {
                              evaluationName: event.target.value,
                           })
                        }
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Tipo de evaluacion</Label>
                     <Select
                        value={block.evaluativeFormat || undefined}
                        onValueChange={(value) =>
                           onUpdateBlock(block.order, {
                              evaluativeFormat:
                                 value as NonNullable<ClassSession["evaluativeFormat"]>,
                           })
                        }
                     >
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue placeholder="Seleccionar tipo evaluativo..." />
                        </SelectTrigger>
                        <SelectContent>
                           {evaluativeFormatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                     <Label className="text-xs">Descripcion</Label>
                     <Textarea
                        className="text-xs min-h-[70px] resize-none"
                        value={block.evaluationDescription ?? ""}
                        onChange={(event) =>
                           onUpdateBlock(block.order, {
                              evaluationDescription: event.target.value,
                           })
                        }
                     />
                  </div>
               </>
            )}
         </div>
      </div>
   );
}
