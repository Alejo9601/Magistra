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
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getAssignmentsByInstitution,
   getSubjectById,
   institutions,
} from "@/lib/edu-repository";
import { resolveAssignmentIdForInstitution } from "@/features/planning/institution-context-guards";
import type { ClassFormInput } from "@/features/planning/types";
import { ClassMetaFields } from "@/features/planning/components/class-meta-fields";
import { ClassPlanningBlockEditor } from "@/features/planning/components/class-planning-block-editor";
import { BlockPlanningHeader } from "@/features/planning/components/block-planning-header";
import { PlanningModeToggle } from "@/features/planning/components/planning-mode-toggle";
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

function cloneBlockContent(source: ClassBlock, order: number): ClassBlock {
   return {
      order,
      topic: source.topic,
      subtopics: [...source.subtopics],
      type: source.type,
      evaluativeFormat: source.evaluativeFormat,
      practiceActivityName: source.practiceActivityName,
      practiceActivityDescription: source.practiceActivityDescription,
      evaluationName: source.evaluationName,
      evaluationDescription: source.evaluationDescription,
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
   const [planBlocksSeparately, setPlanBlocksSeparately] = useState(false);
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
         prev.map((block) => {
            const shouldUpdate = !planBlocksSeparately || block.order === order;
            if (!shouldUpdate) {
               return block;
            }
            return {
               ...block,
               ...updates,
               order: block.order,
            };
         }),
      );
   };

   const handlePlanModeChange = (enabled: boolean) => {
      setPlanBlocksSeparately(enabled);
      if (!enabled) {
         setBlocks((prev) => {
            if (prev.length <= 1) {
               return prev;
            }
            const base = prev[0] ?? createEmptyBlock(1);
            return prev.map((_, index) => cloneBlockContent(base, index + 1));
         });
      }
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
      setPlanBlocksSeparately(false);

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

            <ClassMetaFields
               institutionId={institutionId}
               isInstitutionLocked={isInstitutionLocked}
               institutions={institutions.map((institution) => ({
                  id: institution.id,
                  name: institution.name,
               }))}
               assignmentId={assignmentId}
               onAssignmentChange={handleAssignmentChange}
               availableAssignments={availableAssignments.map((assignment) => ({
                  id: assignment.id,
                  subjectId: assignment.subjectId,
                  section: assignment.section,
               }))}
               resolveSubjectName={(subjectId) => getSubjectById(subjectId)?.name ?? null}
               date={date}
               time={time}
               dateMin={initialClass ? undefined : todayStr}
               isScheduledSlotLocked={isScheduledSlotLocked}
               onDateChange={setDate}
               onTimeChange={setTime}
            />

            <div className="space-y-3">
               <BlockPlanningHeader blockDurationMinutes={blockDurationMinutes} />
               <PlanningModeToggle
                  planBlocksSeparately={planBlocksSeparately}
                  onChange={handlePlanModeChange}
               />

               <div className="space-y-3">
                  {(planBlocksSeparately ? blocks : blocks.slice(0, 1)).map((block) => (
                     <ClassPlanningBlockEditor
                        key={block.order}
                        block={block}
                        planBlocksSeparately={planBlocksSeparately}
                        classCharacterOptions={classCharacterOptions}
                        evaluativeFormatOptions={evaluativeFormatOptions}
                        onUpdateBlock={updateBlock}
                     />
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
























