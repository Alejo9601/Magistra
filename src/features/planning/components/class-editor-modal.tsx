import { useEffect, useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getAssignmentsByInstitution,
   getSubjectById,
   institutions,
} from "@/lib/edu-repository";
import {
   resolveAssignmentIdForInstitution,
   resolveInstitutionId,
} from "@/features/planning/utils/institution-context-guards";
import type { ClassFormInput } from "@/features/planning/types";
import { ClassMetaFields } from "@/features/planning/components/class-meta-fields";
import { ClassEditorFooterActions } from "@/features/planning/components/class-editor-footer-actions";
import { ClassEditorPlanningSection } from "@/features/planning/components/class-editor-planning-section";
import { ClassEditorResourcesField } from "@/features/planning/components/class-editor-resources-field";
import {
   classCharacterOptions,
   cloneBlockContent,
   createEmptyBlock,
   deriveBlocksFromClass,
   evaluativeFormatOptions,
   normalizeBlockDuration,
   normalizeBlocksForSubmit,
   resolveClassDataFromBlocks,
} from "@/features/planning/utils/class-editor-form-utils";
import { toast } from "sonner";
import type { ClassBlock, ClassSession } from "@/types";


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
   const institutionId = resolveInstitutionId(
      activeInstitution,
      initialClass?.institutionId,
      institutions[0]?.id,
   );
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
      const nextInstitution = resolveInstitutionId(
         activeInstitution,
         initialClass?.institutionId,
         institutions[0]?.id,
      );
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
      const nextBlocks = deriveBlocksFromClass(initialClass, nextBlockDuration);
      setBlocks(nextBlocks);
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

      const normalizedBlocks = normalizeBlocksForSubmit(blocks);
      const durationMinutes = normalizedBlocks.length * blockDurationMinutes;
      const {
         hasBlockContent,
         resolvedTopic,
         resolvedSubtopics,
         resolvedType,
         resolvedEvaluativeFormat,
         resolvedPracticeActivityName,
         resolvedPracticeActivityDescription,
         resolvedEvaluationName,
         resolvedEvaluationDescription,
      } = resolveClassDataFromBlocks(normalizedBlocks);
      if (!hasBlockContent) {
         toast.error("Completa al menos un bloque con contenido.");
         return;
      }

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

            <ClassEditorPlanningSection
               blockDurationMinutes={blockDurationMinutes}
               planBlocksSeparately={planBlocksSeparately}
               blocks={blocks}
               classCharacterOptions={classCharacterOptions}
               evaluativeFormatOptions={evaluativeFormatOptions}
               onPlanModeChange={handlePlanModeChange}
               onUpdateBlock={updateBlock}
            />

            <ClassEditorResourcesField
               value={resourcesText}
               onChange={setResourcesText}
            />

            <ClassEditorFooterActions
               onClose={() => onOpenChange(false)}
               onSaveDraft={() => submit("draft")}
               onPublish={() => submit("publish")}
            />
         </DialogContent>
      </Dialog>
   );
}


































