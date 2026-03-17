import { useEffect, useMemo, useState } from "react";
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
      modalidad: "teorico",
      unidad: "",
      tema: "",
      actividades: "",
   };
}

function normalizeBlockDuration(value: number | undefined) {
   if (!value || Number.isNaN(value) || value <= 0) {
      return 40;
   }
   return Math.round(value);
}

function calculateBlockCount(durationMinutes: number, blockDurationMinutes: number) {
   const safeBlockDuration = normalizeBlockDuration(blockDurationMinutes);
   const raw = Math.round(durationMinutes / safeBlockDuration);
   return Math.max(1, Math.min(3, raw));
}

function buildBlocks(
   durationMinutes: number,
   blockDurationMinutes: number,
   previous: ClassBlock[] = [],
) {
   const count = calculateBlockCount(durationMinutes, blockDurationMinutes);
   return Array.from({ length: count }, (_, index) => {
      const order = index + 1;
      const existing = previous.find((block) => block.order === order);
      return existing
         ? { ...existing, order }
         : createEmptyBlock(order);
   });
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
   const [durationMinutes, setDurationMinutes] = useState(40);
   const [blocks, setBlocks] = useState<ClassBlock[]>([createEmptyBlock(1)]);
   const [topic, setTopic] = useState("");
   const [type, setType] = useState<ClassSession["type"]>("teorica");
   const [evaluativeFormat, setEvaluativeFormat] = useState<
      ClassSession["evaluativeFormat"] | ""
   >("");
   const [subtopicsText, setSubtopicsText] = useState("");
   const [practiceActivityName, setPracticeActivityName] = useState("");
   const [practiceActivityDescription, setPracticeActivityDescription] = useState("");
   const [evaluationName, setEvaluationName] = useState("");
   const [evaluationDescription, setEvaluationDescription] = useState("");
   const [resourcesText, setResourcesText] = useState("");

   const availableAssignments = getAssignmentsByInstitution(institutionId);

   const durationOptions = useMemo(() => {
      const safe = normalizeBlockDuration(blockDurationMinutes);
      return [1, 2, 3].map((multiplier) => ({
         multiplier,
         totalMinutes: safe * multiplier,
      }));
   }, [blockDurationMinutes]);

   const applyDuration = (
      nextDurationMinutes: number,
      nextBlockDuration: number,
      sourceBlocks?: ClassBlock[],
   ) => {
      const normalizedBlockDuration = normalizeBlockDuration(nextBlockDuration);
      const normalizedDuration =
         normalizedBlockDuration *
         calculateBlockCount(nextDurationMinutes, normalizedBlockDuration);
      setDurationMinutes(normalizedDuration);
      setBlocks(buildBlocks(normalizedDuration, normalizedBlockDuration, sourceBlocks ?? blocks));
   };

   const handleAssignmentChange = (nextAssignmentId: string) => {
      setAssignmentId(nextAssignmentId);
      const assignment = getAssignmentById(nextAssignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;
      const nextBlockDuration = normalizeBlockDuration(
         subject?.blockDurationMinutes,
      );
      const currentCount = Math.max(1, Math.min(3, blocks.length || 1));
      setBlockDurationMinutes(nextBlockDuration);
      applyDuration(nextBlockDuration * currentCount, nextBlockDuration, blocks);
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

      const initialDuration =
         initialClass?.durationMinutes ??
         nextBlockDuration *
            Math.max(1, Math.min(3, initialClass?.blocks?.length ?? 1));
      const sourceBlocks = initialClass?.blocks ?? [createEmptyBlock(1)];
      applyDuration(initialDuration, nextBlockDuration, sourceBlocks);

      setDate(initialClass?.date ?? initialDate ?? "");
      setTime(initialClass?.time ?? "08:00");
      setTopic(initialClass?.topic ?? "");
      const initialType =
         normalizeClassType((initialClass?.type as ClassSession["type"] | "oral" | "") ?? "teorica") ||
         "teorica";
      setType(initialType);
      setEvaluativeFormat(
         initialType === "evaluacion"
            ? normalizeEvaluativeFormat(initialClass?.evaluativeFormat ?? "")
            : "",
      );
      setSubtopicsText(initialClass?.subtopics.join("\n") ?? "");
      setPracticeActivityName(initialClass?.practiceActivityName ?? "");
      setPracticeActivityDescription(initialClass?.practiceActivityDescription ?? "");
      setEvaluationName(initialClass?.evaluationName ?? "");
      setEvaluationDescription(initialClass?.evaluationDescription ?? "");
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
      if ((type === "practica" || type === "teorico-practica") && !practiceActivityName.trim()) {
         toast.error("Completa el nombre de la actividad practica.");
         return;
      }
      if ((type === "practica" || type === "teorico-practica") && !practiceActivityDescription.trim()) {
         toast.error("Completa la descripcion de la actividad practica.");
         return;
      }
      if (type === "evaluacion" && !evaluationName.trim()) {
         toast.error("Completa el nombre de la evaluacion.");
         return;
      }
      if (type === "evaluacion" && !evaluativeFormat) {
         toast.error("Selecciona el tipo de evaluacion.");
         return;
      }
      if (type === "evaluacion" && !evaluationDescription.trim()) {
         toast.error("Completa la descripcion de la evaluacion.");
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

      const normalizedBlocks = buildBlocks(durationMinutes, blockDurationMinutes, blocks);
      const hasBlockContent = normalizedBlocks.some(
         (block) =>
            block.tema.trim().length > 0 ||
            block.unidad.trim().length > 0 ||
            block.actividades.trim().length > 0,
      );
      if (!topic.trim() && !hasBlockContent) {
         toast.error("Completa el tema principal o carga contenido en algun bloque.");
         return;
      }

      const manualSubtopics = subtopicsText
         .split("\n")
         .map((value) => value.trim())
         .filter(Boolean);
      const blockTopics = normalizedBlocks
         .flatMap((block) => [block.unidad.trim(), block.tema.trim()])
         .filter((value) => value.length > 0);

      const resolvedTopic =
         topic.trim() ||
         normalizedBlocks.find((block) => block.tema.trim().length > 0)?.tema.trim() ||
         "Por planificar";
      const resolvedSubtopics =
         manualSubtopics.length > 0
            ? manualSubtopics
            : Array.from(new Set(blockTopics)).filter((item) => item !== resolvedTopic);

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
            type,
            status: mode === "publish" ? "planificada" : "sin-planificar",
            evaluativeFormat:
               type === "evaluacion" ? (evaluativeFormat || undefined) : undefined,
            practiceActivityName:
               type === "practica" || type === "teorico-practica"
                  ? practiceActivityName.trim() || undefined
                  : undefined,
            practiceActivityDescription:
               type === "practica" || type === "teorico-practica"
                  ? practiceActivityDescription.trim() || undefined
                  : undefined,
            evaluationName:
               type === "evaluacion" ? evaluationName.trim() || undefined : undefined,
            evaluationDescription:
               type === "evaluacion"
                  ? evaluationDescription.trim() || undefined
                  : undefined,
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

               <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Duracion total de clase</Label>
                  <Select
                     value={String(durationMinutes)}
                     onValueChange={(value) =>
                        applyDuration(Number(value), blockDurationMinutes, blocks)
                     }
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar duracion" />
                     </SelectTrigger>
                     <SelectContent>
                        {durationOptions.map((option) => (
                           <SelectItem key={option.multiplier} value={String(option.totalMinutes)}>
                              {option.totalMinutes} min ({option.multiplier} bloque{option.multiplier > 1 ? "s" : ""} de {blockDurationMinutes} min)
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-3">
               <div>
                  <p className="text-xs font-semibold text-foreground">Bloques de clase</p>
                  <p className="text-[11px] text-muted-foreground">
                     Se generan automaticamente segun la duracion total. Solo puedes editarlos.
                  </p>
               </div>

               <div className="space-y-3">
                  {blocks.map((block) => (
                     <div key={block.order} className="rounded-md border border-border/60 p-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground">Bloque {block.order}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Modalidad</Label>
                              <Select
                                 value={block.modalidad}
                                 onValueChange={(value) =>
                                    updateBlock(block.order, { modalidad: value as ClassBlock["modalidad"] })
                                 }
                              >
                                 <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Seleccionar modalidad" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="teorico">Teorico</SelectItem>
                                    <SelectItem value="practico">Practico</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Unidad</Label>
                              <Input
                                 className="h-9 text-xs"
                                 value={block.unidad}
                                 onChange={(event) =>
                                    updateBlock(block.order, { unidad: event.target.value })
                                 }
                              />
                           </div>
                           <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Tema</Label>
                              <Input
                                 className="h-9 text-xs"
                                 value={block.tema}
                                 onChange={(event) =>
                                    updateBlock(block.order, { tema: event.target.value })
                                 }
                              />
                           </div>
                           <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <Label className="text-xs">Actividades</Label>
                              <Textarea
                                 className="text-xs min-h-[70px] resize-none"
                                 value={block.actividades}
                                 onChange={(event) =>
                                    updateBlock(block.order, { actividades: event.target.value })
                                 }
                              />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-4 pb-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Eje principal / Tema principal</Label>
                  <Input
                     className="h-9 text-xs"
                     value={topic}
                     onChange={(event) => setTopic(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Subtemas (uno por linea)</Label>
                  <Textarea
                     className="text-xs min-h-[70px] resize-none"
                     value={subtopicsText}
                     onChange={(event) => setSubtopicsText(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Caracter de la clase</Label>
                  <Select
                     value={type}
                     onValueChange={(value) => {
                        const nextType = value as ClassSession["type"];
                        setType(nextType);
                        if (nextType !== "evaluacion") {
                           setEvaluativeFormat("");
                           setEvaluationName("");
                           setEvaluationDescription("");
                        }
                        if (nextType !== "practica" && nextType !== "teorico-practica") {
                           setPracticeActivityName("");
                           setPracticeActivityDescription("");
                        }
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

               {(type === "practica" || type === "teorico-practica") && (
                  <>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nombre de la actividad</Label>
                        <Input
                           className="h-9 text-xs"
                           value={practiceActivityName}
                           onChange={(event) => setPracticeActivityName(event.target.value)}
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Descripcion</Label>
                        <Textarea
                           className="text-xs min-h-[70px] resize-none"
                           value={practiceActivityDescription}
                           onChange={(event) => setPracticeActivityDescription(event.target.value)}
                        />
                     </div>
                  </>
               )}

               {type === "evaluacion" && (
                  <>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Nombre de la evaluacion</Label>
                        <Input
                           className="h-9 text-xs"
                           value={evaluationName}
                           onChange={(event) => setEvaluationName(event.target.value)}
                        />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Tipo de evaluacion</Label>
                        <Select
                           value={evaluativeFormat || undefined}
                           onValueChange={(value) =>
                              setEvaluativeFormat(value as NonNullable<ClassSession["evaluativeFormat"]>)
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
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Descripcion</Label>
                        <Textarea
                           className="text-xs min-h-[70px] resize-none"
                           value={evaluationDescription}
                           onChange={(event) => setEvaluationDescription(event.target.value)}
                        />
                     </div>
                  </>
               )}
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
