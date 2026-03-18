import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getAssignmentsByInstitution,
   getSubjectById,
   institutions,
} from "@/lib/edu-repository";
import { resolveAssignmentIdForInstitution } from "@/features/planning/institution-context-guards";
import type { ClassFormInput } from "@/features/planning/types";
import { toast } from "sonner";
import type { ClassBlock, ClassSession } from "@/types";

const classCharacterOptions: Array<{
   value: ClassSession["type"];
   label: string;
}> = [
   { value: "teorica", label: "Teorica" },
   { value: "practica", label: "Practica" },
   { value: "teorico-practica", label: "Teorica/Practica" },
   { value: "evaluacion", label: "Evaluativa" },
];

const evaluativeFormatOptions: Array<{
   value: NonNullable<ClassSession["evaluativeFormat"]>;
   label: string;
}> = [
   { value: "oral", label: "Oral" },
   { value: "escrito", label: "Escrito" },
   { value: "actividad-practica", label: "Actividad Practica" },
   { value: "otro", label: "Otro" },
];

function normalizeClassType(
   value: ClassSession["type"] | "oral" | "",
): ClassSession["type"] | "" {
   if (value === "oral") {
      return "evaluacion";
   }
   return value as ClassSession["type"] | "";
}

function normalizeEvaluativeFormat(
   value: ClassSession["evaluativeFormat"] | "",
): ClassSession["evaluativeFormat"] | "" {
   if (value === "exposicion-oral" || value === "examen-oral") {
      return "oral";
   }
   if (value === "examen-escrito") {
      return "escrito";
   }
   if (value === "trabajo-practico-evaluativo") {
      return "actividad-practica";
   }
   return value;
}

function createEmptyBlock(order: number): ClassBlock {
   return {
      order,
      topic: "",
      subtopics: [],
      type: "teorica",
      evaluativeFormat: undefined,
      practiceActivityName: undefined,
      practiceActivityDescription: undefined,
      evaluationName: undefined,
      evaluationDescription: undefined,
   };
}

function normalizeBlockDuration(value: number | undefined) {
   if (!value || Number.isNaN(value) || value <= 0) {
      return 40;
   }
   return Math.round(value);
}


export function ClassEditorModal({
   open,
   onOpenChange,
   activeInstitution,
   initialClass,
   initialDate,
   onSubmit,
}: {
   open: boolean;
   onOpenChange: (v: boolean) => void;
   activeInstitution: string;
   initialClass: ClassSession | null;
   initialDate?: string;
   onSubmit: (payload: ClassFormInput, mode: "draft" | "publish") => void;
}) {
   const isInstitutionLocked = true;
   const isScheduledSlotLocked = Boolean(
      initialClass && initialClass.date && initialClass.time,
   );
   const institutionId = activeInstitution;
   const today = new Date();
   const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
   const [assignmentId, setAssignmentId] = useState("");
   const [date, setDate] = useState("");
   const [time, setTime] = useState("08:00");
   const [blockDurationMinutes, setBlockDurationMinutes] = useState(40);
      const [blocks, setBlocks] = useState<ClassBlock[]>([createEmptyBlock(1)]);
   const [resourcesText, setResourcesText] = useState("");

   const availableAssignments = getAssignmentsByInstitution(institutionId);

   const handleAssignmentChange = (nextAssignmentId: string) => {
      setAssignmentId(nextAssignmentId);
      const assignment = getAssignmentById(nextAssignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;
      const nextBlockDuration = normalizeBlockDuration(
         subject?.blockDurationMinutes,
      );
      setBlockDurationMinutes(nextBlockDuration);
   };

   const updateBlock = (order: number, updates: Partial<ClassBlock>) => {
      setBlocks((prev) =>
         prev.map((block) =>
            block.order === order
               ? {
                    ...block,
                    ...updates,
                 }
               : block,
         ),
      );
   };

   const reset = () => {
      const nextInstitution = activeInstitution;
      const candidateAssignmentId =
         initialClass?.assignmentId ??
         (initialClass?.subjectId
            ? getAssignmentIdBySubjectId(initialClass.subjectId)
            : "");
      const resolvedAssignmentId = resolveAssignmentIdForInstitution({
         institutionId: nextInstitution,
         candidateAssignmentId,
         assignmentsByInstitution: getAssignmentsByInstitution(nextInstitution),
         getAssignmentById,
      });
      setAssignmentId(resolvedAssignmentId);

      const assignment = getAssignmentById(resolvedAssignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;
      const nextBlockDuration = normalizeBlockDuration(
         initialClass?.blockDurationMinutes ?? subject?.blockDurationMinutes,
      );
      setBlockDurationMinutes(nextBlockDuration);
      const initialType =
         (normalizeClassType(
            (initialClass?.type as ClassSession["type"] | "oral" | "") ?? "teorica",
         ) || "teorica") as ClassBlock["type"];
      const inferredBlockCount = Math.max(
         1,
         Math.round((initialClass?.durationMinutes ?? nextBlockDuration) / nextBlockDuration),
      );
      const sourceBlocks =
         initialClass?.blocks && initialClass.blocks.length > 0
            ? initialClass.blocks
            : Array.from({ length: inferredBlockCount }, (_, index) =>
                 index === 0
                    ? {
                         ...createEmptyBlock(1),
                         topic: initialClass?.topic ?? "",
                         subtopics: initialClass?.subtopics ?? [],
                         type: initialType,
                         evaluativeFormat:
                            initialType === "evaluacion"
                               ? normalizeEvaluativeFormat(
                                    initialClass?.evaluativeFormat ?? "",
                                 ) || undefined
                               : undefined,
                         practiceActivityName:
                            initialType === "practica" || initialType === "teorico-practica"
                               ? initialClass?.practiceActivityName
                               : undefined,
                         practiceActivityDescription:
                            initialType === "practica" || initialType === "teorico-practica"
                               ? initialClass?.practiceActivityDescription
                               : undefined,
                         evaluationName:
                            initialType === "evaluacion"
                               ? initialClass?.evaluationName
                               : undefined,
                         evaluationDescription:
                            initialType === "evaluacion"
                               ? initialClass?.evaluationDescription
                               : undefined,
                      }
                    : createEmptyBlock(index + 1),
              );
      setBlocks(
         sourceBlocks.length > 0
            ? sourceBlocks.map((block, index) => ({ ...block, order: index + 1 }))
            : [createEmptyBlock(1)],
      );

      setDate(initialClass?.date ?? initialDate ?? "");
      setTime(initialClass?.time ?? "08:00");
      setResourcesText(initialClass?.resources?.join(", ") ?? "");
   };

   useEffect(() => {
      if (open) {
         reset();
      }
   }, [open, initialClass, initialDate, activeInstitution]);

   const submit = (mode: "draft" | "publish") => {
      if (!assignmentId || !date || !time) {
         toast.error("Completa institucion, materia, fecha y hora.");
         return;
      }
      if (!initialClass && date < todayStr) {
         toast.error("No se pueden crear clases en fechas pasadas.");
         return;
      }
      const resources = resourcesText
         .split(",")
         .map((value) => value.trim())
         .filter(Boolean);

      const assignment = getAssignmentById(assignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;
      if (!assignment || !subject) {
         toast.error("Selecciona un grupo valido.");
         return;
      }

      const normalizedBlocks =
         blocks.length > 0
            ? blocks.map((block, index) => ({ ...block, order: index + 1 }))
            : [createEmptyBlock(1)];
      const durationMinutes = normalizedBlocks.length * blockDurationMinutes;
      const primaryBlock = normalizedBlocks[0];
      const hasBlockContent = normalizedBlocks.some(
         (block) =>
            block.topic.trim().length > 0 ||
            block.subtopics.length > 0 ||
            (block.practiceActivityName?.trim().length ?? 0) > 0 ||
            (block.evaluationName?.trim().length ?? 0) > 0,
      );
      if (!hasBlockContent) {
         toast.error("Completa al menos un bloque con contenido.");
         return;
      }



      const blockTopics = normalizedBlocks
         .flatMap((block) => [block.topic.trim(), ...block.subtopics.map((subtopic) => subtopic.trim())])
         .filter((value) => value.length > 0);

      const resolvedTopic =
         normalizedBlocks.find((block) => block.topic.trim().length > 0)?.topic.trim() ||
         "Por planificar";
      const resolvedSubtopics =
         Array.from(new Set(blockTopics)).filter((item) => item !== resolvedTopic);

      const resolvedType = primaryBlock?.type ?? "teorica";
      const resolvedEvaluativeFormat =
         resolvedType === "evaluacion"
            ? primaryBlock?.evaluativeFormat ?? undefined
            : undefined;
      const resolvedPracticeActivityName =
         resolvedType === "practica" || resolvedType === "teorico-practica"
            ? primaryBlock?.practiceActivityName?.trim() || undefined
            : undefined;
      const resolvedPracticeActivityDescription =
         resolvedType === "practica" || resolvedType === "teorico-practica"
            ? primaryBlock?.practiceActivityDescription?.trim() || undefined
            : undefined;
      const resolvedEvaluationName =
         resolvedType === "evaluacion"
            ? primaryBlock?.evaluationName?.trim() || undefined
            : undefined;
      const resolvedEvaluationDescription =
         resolvedType === "evaluacion"
            ? primaryBlock?.evaluationDescription?.trim() || undefined
            : undefined;

      onSubmit(
         {
            institutionId: assignment.institutionId,
            subjectId: assignment.subjectId,
            assignmentId: assignment.id,
            date,
            time,
            durationMinutes,
            blockDurationMinutes,
            blocks: normalizedBlocks,
            topic: resolvedTopic,
            subtopics: resolvedSubtopics,
            type: resolvedType,
            status: mode === "publish" ? "planificada" : "sin-planificar",
            evaluativeFormat: resolvedEvaluativeFormat,
            practiceActivityName: resolvedPracticeActivityName,
            practiceActivityDescription: resolvedPracticeActivityDescription,
            evaluationName: resolvedEvaluationName,
            evaluationDescription: resolvedEvaluationDescription,
            resources: resources.length > 0 ? resources : undefined,
         },
         mode,
      );
      onOpenChange(false);
   };

   return (
      <Dialog
         open={open}
         onOpenChange={onOpenChange}
      >
         <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>{initialClass ? "Editar clase" : "Nueva clase"}</DialogTitle>
               <DialogDescription>
                  Crea una clase completa y el sistema genera automaticamente sus bloques.
               </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Institucion</Label>
                  <Select
                     value={institutionId}
                     disabled={isInstitutionLocked}
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                     </SelectTrigger>
                     <SelectContent>
                        {institutions.map((institution) => (
                           <SelectItem key={institution.id} value={institution.id}>
                              {institution.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Materia</Label>
                  <Select value={assignmentId} onValueChange={handleAssignmentChange}>
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                     </SelectTrigger>
                     <SelectContent>
                        {availableAssignments.map((assignment) => {
                           const subject = getSubjectById(assignment.subjectId);
                           if (!subject) return null;
                           return (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                 {subject.name} ({assignment.section})
                              </SelectItem>
                           );
                        })}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Fecha</Label>
                  <Input
                     type="date"
                     className="h-9 text-xs"
                     value={date}
                     min={initialClass ? undefined : todayStr}
                     disabled={isScheduledSlotLocked}
                     onChange={(event) => setDate(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Hora</Label>
                  <Input
                     type="time"
                     className="h-9 text-xs"
                     value={time}
                     disabled={isScheduledSlotLocked}
                     onChange={(event) => setTime(event.target.value)}
                  />
               </div>
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-3">
               <div>
                  <p className="text-xs font-semibold text-foreground">Bloques de clase</p>
                  <p className="text-[11px] text-muted-foreground">
                     Duracion por bloque: {blockDurationMinutes} min. Solo puedes editar su contenido.
                  </p>
               </div>

               <div className="space-y-3">
                  {blocks.map((block) => (
                     <div key={block.order} className="rounded-md border border-border/60 p-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground">Bloque {block.order}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <Label className="text-xs">Eje principal / Tema principal</Label>
                              <Input
                                 className="h-9 text-xs"
                                 value={block.topic}
                                 onChange={(event) =>
                                    updateBlock(block.order, { topic: event.target.value })
                                 }
                              />
                           </div>
                           <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <Label className="text-xs">Subtemas (uno por linea)</Label>
                              <Textarea
                                 className="text-xs min-h-[70px] resize-none"
                                 value={block.subtopics.join("\n")}
                                 onChange={(event) =>
                                    updateBlock(block.order, {
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
                                    updateBlock(block.order, {
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
                                          updateBlock(block.order, {
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
                                          updateBlock(block.order, {
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
                                          updateBlock(block.order, {
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
                                          updateBlock(block.order, {
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
                                          updateBlock(block.order, {
                                             evaluationDescription: event.target.value,
                                          })
                                       }
                                    />
                                 </div>
                              </>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-4 pb-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Recursos (coma separada)</Label>
                  <Input
                     className="h-9 text-xs"
                     value={resourcesText}
                     onChange={(event) => setResourcesText(event.target.value)}
                  />
               </div>
            </div>

            <DialogFooter className="gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onOpenChange(false)}
               >
                  Cancelar
               </Button>
               <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => submit("draft")}
               >
                  Guardar borrador
               </Button>
               <Button size="sm" className="text-xs" onClick={() => submit("publish")}>
                  Guardar y publicar
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}






