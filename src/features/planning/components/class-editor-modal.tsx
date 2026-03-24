import { useEffect, useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
   resolveAssignmentIdForInstitution,
   resolveInstitutionId,
} from "@/features/planning/utils/institution-context-guards";
import { normalizeBlockDuration } from "@/features/planning/utils/class-editor-form-utils";
import type { ClassFormInput } from "@/features/planning/types";
import type { ActivityType, ClassBlock, ClassSession, SubjectActivity } from "@/types";
import { toast } from "sonner";

type BlockDraft = {
   id: string;
   topic: string;
   activity: string;
};

const classTypeOptions: Array<{
   value: Exclude<ClassSession["type"], "evaluacion" | "repaso" | "recuperatorio" | "oral">;
   label: string;
}> = [
   { value: "teorica", label: "Teorica" },
   { value: "practica", label: "Practica" },
   { value: "teorico-practica", label: "Mixta" },
];

const activityTypeOptions: Array<{ value: ActivityType; label: string }> = [
   { value: "practica", label: "Practica" },
   { value: "examen", label: "Examen" },
   { value: "proyecto", label: "Proyecto" },
   { value: "tarea", label: "Tarea" },
];

function createEmptyBlockDraft(index: number): BlockDraft {
   return {
      id: `block-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
      topic: "",
      activity: "",
   };
}

function formatShortDate(date?: string) {
   if (!date) {
      return "Sin fecha";
   }
   const [, month, day] = date.split("-");
   if (!month || !day) {
      return date;
   }
   return `${day}/${month}`;
}

function normalizeClassType(
   value: ClassSession["type"] | "",
): Exclude<ClassSession["type"], "evaluacion" | "repaso" | "recuperatorio" | "oral"> {
   if (value === "teorica" || value === "practica" || value === "teorico-practica") {
      return value;
   }
   return "teorico-practica";
}

export function ClassEditorModal({
   open,
   onOpenChange,
   activeInstitution,
   initialClass,
   initialDate,
   allClasses,
   allActivities,
   onSubmit,
}: {
   open: boolean;
   onOpenChange: (v: boolean) => void;
   activeInstitution: string;
   initialClass: ClassSession | null;
   initialDate?: string;
   allClasses: ClassSession[];
   allActivities: SubjectActivity[];
   onSubmit: (
      payload: ClassFormInput,
      mode: "draft" | "publish",
      options?: { linkedActivityId?: string },
   ) => void;
}) {
   const topicSuggestionsListId = useId();
   const axisSuggestionsListId = useId();
   const isScheduledSlotLocked = Boolean(initialClass && initialClass.date && initialClass.time);
   const institutionId = resolveInstitutionId(
      activeInstitution,
      initialClass?.institutionId,
      institutions[0]?.id,
   );

   const [assignmentId, setAssignmentId] = useState("");
   const [date, setDate] = useState("");
   const [time, setTime] = useState("08:00");
   const [blockDurationMinutes, setBlockDurationMinutes] = useState(40);
   const [mainTopic, setMainTopic] = useState("");
   const [axis, setAxis] = useState("");
   const [classType, setClassType] = useState<
      Exclude<ClassSession["type"], "evaluacion" | "repaso" | "recuperatorio" | "oral">
   >("teorico-practica");
   const [planByBlocks, setPlanByBlocks] = useState(false);
   const [blocks, setBlocks] = useState<BlockDraft[]>([createEmptyBlockDraft(1)]);
   const [activityMode, setActivityMode] = useState<"none" | "menu" | "create" | "link">("none");
   const [activityType, setActivityType] = useState<ActivityType>("practica");
   const [newActivityName, setNewActivityName] = useState("");
   const [newActivityDescription, setNewActivityDescription] = useState("");
   const [linkedActivityId, setLinkedActivityId] = useState("");

   const availableAssignments = getAssignmentsByInstitution(institutionId);

   const scopedTopicClasses = useMemo(() => {
      if (!assignmentId) {
         return [];
      }
      return allClasses
         .filter((item) => {
            const itemAssignmentId = item.assignmentId ?? getAssignmentIdBySubjectId(item.subjectId);
            return itemAssignmentId === assignmentId;
         })
         .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
   }, [allClasses, assignmentId]);

   const topicSuggestions = useMemo(
      () =>
         Array.from(
            new Set(
               scopedTopicClasses
                  .map((item) => item.topic.trim())
                  .filter((value) => value.length > 0),
            ),
         ).slice(0, 8),
      [scopedTopicClasses],
   );

   const axisSuggestions = useMemo(
      () =>
         Array.from(
            new Set(
               scopedTopicClasses
                  .flatMap((item) => item.subtopics)
                  .map((value) => value.trim())
                  .filter((value) => value.length > 0),
            ),
         ).slice(0, 8),
      [scopedTopicClasses],
   );

   const suggestedContinuationTopic = topicSuggestions[0] ?? "";

   const availableActivities = useMemo(() => {
      if (!assignmentId) {
         return [];
      }
      return allActivities.filter((activity) => {
         const activityAssignmentId =
            activity.assignmentId ?? getAssignmentIdBySubjectId(activity.subjectId);
         return activityAssignmentId === assignmentId;
      });
   }, [allActivities, assignmentId]);

   const selectedAssignment = assignmentId ? getAssignmentById(assignmentId) : null;
   const selectedSubject = selectedAssignment
      ? getSubjectById(selectedAssignment.subjectId)
      : null;

   const contextLabel = `${selectedSubject?.name ?? "Materia"} - ${selectedAssignment?.section ?? "Curso"} · ${formatShortDate(date)}`;

   const handleAssignmentChange = (nextAssignmentId: string) => {
      setAssignmentId(nextAssignmentId);
      const assignment = getAssignmentById(nextAssignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;
      setBlockDurationMinutes(normalizeBlockDuration(subject?.blockDurationMinutes));
      setLinkedActivityId("");
   };

   const reset = () => {
      const nextInstitution = resolveInstitutionId(
         activeInstitution,
         initialClass?.institutionId,
         institutions[0]?.id,
      );
      const candidateAssignmentId =
         initialClass?.assignmentId ??
         (initialClass?.subjectId ? getAssignmentIdBySubjectId(initialClass.subjectId) : "");
      const resolvedAssignmentId = resolveAssignmentIdForInstitution({
         institutionId: nextInstitution,
         candidateAssignmentId,
         assignmentsByInstitution: getAssignmentsByInstitution(nextInstitution),
         getAssignmentById,
      });

      const assignment = getAssignmentById(resolvedAssignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;

      setAssignmentId(resolvedAssignmentId);
      setDate(initialClass?.date ?? initialDate ?? "");
      setTime(initialClass?.time ?? "08:00");
      setBlockDurationMinutes(
         normalizeBlockDuration(initialClass?.blockDurationMinutes ?? subject?.blockDurationMinutes),
      );

      setClassType(normalizeClassType(initialClass?.type ?? ""));

      const existingBlocks = initialClass?.blocks ?? [];
      const nextBlocks =
         existingBlocks.length > 0
            ? existingBlocks.map((block, index) => ({
                 id: `block-initial-${index}`,
                 topic: block.topic,
                 activity: block.practiceActivityName ?? "",
              }))
            : [
                 {
                    id: "block-initial-0",
                    topic: initialClass?.topic ?? "",
                    activity: initialClass?.practiceActivityName ?? "",
                 },
              ];

      setBlocks(nextBlocks.length > 0 ? nextBlocks : [createEmptyBlockDraft(1)]);
      setPlanByBlocks(nextBlocks.length > 1);
      setMainTopic(initialClass?.topic ?? "");
      setAxis(initialClass?.subtopics[0] ?? "");

      if ((initialClass?.practiceActivityName ?? "").trim().length > 0) {
         setActivityMode("create");
         setActivityType(initialClass?.practiceActivityType ?? "practica");
         setNewActivityName(initialClass?.practiceActivityName ?? "");
         setNewActivityDescription(initialClass?.practiceActivityDescription ?? "");
      } else {
         setActivityMode("none");
         setActivityType("practica");
         setNewActivityName("");
         setNewActivityDescription("");
      }
      setLinkedActivityId("");
   };

   useEffect(() => {
      if (open) {
         reset();
      }
   }, [open, initialClass, initialDate, activeInstitution]);

   useEffect(() => {
      if (!open || mainTopic.trim().length > 0 || !suggestedContinuationTopic) {
         return;
      }
      if (initialClass?.topic?.trim().length) {
         return;
      }
      setMainTopic(suggestedContinuationTopic);
   }, [initialClass?.topic, mainTopic, open, suggestedContinuationTopic]);

   const updateBlock = (blockId: string, updates: Partial<BlockDraft>) => {
      setBlocks((prev) =>
         prev.map((block) => (block.id === blockId ? { ...block, ...updates } : block)),
      );
   };

   const addBlock = () => {
      setBlocks((prev) => [...prev, createEmptyBlockDraft(prev.length + 1)]);
   };

   const removeBlock = (blockId: string) => {
      setBlocks((prev) => {
         const next = prev.filter((block) => block.id !== blockId);
         return next.length > 0 ? next : [createEmptyBlockDraft(1)];
      });
   };

   const resolveBlocksForSubmit = () => {
      const source = planByBlocks ? blocks : [blocks[0] ?? createEmptyBlockDraft(1)];
      const normalizedSource = source.map((block, index) => ({
         ...block,
         topic:
            block.topic.trim() ||
            (index === 0 ? mainTopic.trim() : "") ||
            (index === 0 ? suggestedContinuationTopic : ""),
      }));

      return normalizedSource.map((block, index): ClassBlock => ({
         order: index + 1,
         topic: block.topic.trim() || "Por planificar",
         subtopics: index === 0 && axis.trim().length > 0 ? [axis.trim()] : [],
         type: classType,
         practiceActivityType:
            classType === "practica" || classType === "teorico-practica"
               ? activityType
               : undefined,
         practiceActivityName:
            classType === "practica" || classType === "teorico-practica"
               ? block.activity.trim() || undefined
               : undefined,
         practiceActivityDescription: undefined,
         evaluationName: undefined,
         evaluationDescription: undefined,
      }));
   };

   const submit = () => {
      if (!assignmentId || !date || !time) {
         toast.error("No se encontro el contexto de la clase.");
         return;
      }

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (!initialClass && date < todayStr) {
         toast.error("No se pueden crear clases en fechas pasadas.");
         return;
      }

      const assignment = getAssignmentById(assignmentId);
      const subject = assignment ? getSubjectById(assignment.subjectId) : null;
      if (!assignment || !subject) {
         toast.error("Selecciona un grupo valido.");
         return;
      }

      const resolvedBlocks = resolveBlocksForSubmit();
      const resolvedTopic =
         mainTopic.trim() ||
         resolvedBlocks.find((block) => block.topic.trim().length > 0)?.topic ||
         suggestedContinuationTopic ||
         "Por planificar";

      const practiceActivityName =
         activityMode === "create"
            ? newActivityName.trim() || undefined
            : resolvedBlocks.find((block) => (block.practiceActivityName ?? "").trim().length > 0)
                 ?.practiceActivityName;

      const payload: ClassFormInput = {
         institutionId: assignment.institutionId,
         subjectId: assignment.subjectId,
         assignmentId: assignment.id,
         date,
         time,
         durationMinutes: Math.max(1, resolvedBlocks.length) * blockDurationMinutes,
         blockDurationMinutes,
         blocks: resolvedBlocks,
         topic: resolvedTopic,
         subtopics: axis.trim().length > 0 ? [axis.trim()] : [],
         type: classType,
         status: "planificada",
         evaluativeFormat: undefined,
         practiceActivityType:
            classType === "practica" || classType === "teorico-practica"
               ? activityType
               : undefined,
         practiceActivityName:
            classType === "practica" || classType === "teorico-practica"
               ? practiceActivityName
               : undefined,
         practiceActivityDescription:
            activityMode === "create" ? newActivityDescription.trim() || undefined : undefined,
         evaluationName: undefined,
         evaluationDescription: undefined,
         activities: undefined,
         notes: initialClass?.notes,
         resources: initialClass?.resources,
      };

      onSubmit(
         payload,
         "publish",
         activityMode === "link" && linkedActivityId
            ? { linkedActivityId }
            : undefined,
      );
      onOpenChange(false);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[760px] max-h-[88vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Planificar clase</DialogTitle>
               <DialogDescription>Defini rapidamente que vas a trabajar.</DialogDescription>
               <p className="text-xs text-muted-foreground">{contextLabel}</p>
            </DialogHeader>

            <div className="space-y-5 py-1">
               <section className="space-y-3">
                  <div className="space-y-1.5">
                     <Label className="text-xs">Tema</Label>
                     <Input
                        autoFocus
                        list={topicSuggestionsListId}
                        value={mainTopic}
                        onChange={(event) => setMainTopic(event.target.value)}
                        placeholder="Escribi o selecciona"
                        className="h-9 text-sm"
                     />
                     <datalist id={topicSuggestionsListId}>
                        {topicSuggestions.map((topic) => (
                           <option key={topic} value={topic} />
                        ))}
                     </datalist>
                     {suggestedContinuationTopic ? (
                        <button
                           type="button"
                           className="text-[11px] text-primary hover:underline"
                           onClick={() => setMainTopic(suggestedContinuationTopic)}
                        >
                           Continuar ultimo tema: {suggestedContinuationTopic}
                        </button>
                     ) : null}
                  </div>

                  <div className="space-y-1.5">
                     <Label className="text-xs text-muted-foreground">Eje (opcional)</Label>
                     <Input
                        list={axisSuggestionsListId}
                        value={axis}
                        onChange={(event) => setAxis(event.target.value)}
                        placeholder="Escribi o selecciona"
                        className="h-9 w-full text-sm"
                     />
                     <datalist id={axisSuggestionsListId}>
                        {axisSuggestions.map((item) => (
                           <option key={item} value={item} />
                        ))}
                     </datalist>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-xs text-muted-foreground">Tipo de clase</Label>
                     <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {classTypeOptions.map((option) => (
                           <label
                              key={option.value}
                              className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-xs"
                           >
                              <input
                                 type="radio"
                                 name="class-type"
                                 value={option.value}
                                 checked={classType === option.value}
                                 onChange={() => setClassType(option.value)}
                              />
                              <span>{option.label}</span>
                           </label>
                        ))}
                     </div>
                  </div>
               </section>

               <section className="space-y-2">
                  <p className="text-sm font-medium">Actividades (opcional)</p>

                  {activityMode === "none" ? (
                     <div className="rounded-md border border-dashed border-border/70 p-3">
                        <p className="text-xs text-muted-foreground">No hay actividades planificadas</p>
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           className="mt-2 text-xs"
                           onClick={() => setActivityMode("menu")}
                        >
                           + Agregar actividad
                        </Button>
                     </div>
                  ) : null}

                  {activityMode === "menu" ? (
                     <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" className="text-xs" onClick={() => setActivityMode("create")}>
                           + Crear nueva actividad
                        </Button>
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           className="text-xs"
                           onClick={() => setActivityMode("link")}
                        >
                           Vincular existente
                        </Button>
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="text-xs"
                           onClick={() => setActivityMode("none")}
                        >
                           Cancelar
                        </Button>
                     </div>
                  ) : null}

                  {activityMode === "create" ? (
                     <div className="space-y-2 rounded-md border border-border/70 p-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                           <div className="space-y-1.5">
                              <Label className="text-xs">Nombre</Label>
                              <Input
                                 value={newActivityName}
                                 onChange={(event) => setNewActivityName(event.target.value)}
                                 placeholder="Actividad"
                                 className="h-9 text-xs"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-xs">Tipo</Label>
                              <Select
                                 value={activityType}
                                 onValueChange={(value: string) => setActivityType(value as ActivityType)}
                              >
                                 <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {activityTypeOptions.map((option) => (
                                       <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-xs text-muted-foreground">Descripcion (opcional)</Label>
                           <Textarea
                              value={newActivityDescription}
                              onChange={(event) => setNewActivityDescription(event.target.value)}
                              className="min-h-[72px] text-xs resize-none"
                           />
                        </div>
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="text-xs"
                           onClick={() => setActivityMode("none")}
                        >
                           Quitar actividad
                        </Button>
                     </div>
                  ) : null}

                  {activityMode === "link" ? (
                     <div className="space-y-2 rounded-md border border-border/70 p-3">
                        <Label className="text-xs">Actividad existente</Label>
                        <Select
                           value={linkedActivityId || "__none__"}
                           onValueChange={(value: string) =>
                              setLinkedActivityId(value === "__none__" ? "" : value)
                           }
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Seleccionar actividad" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="__none__">Sin vinculacion</SelectItem>
                              {availableActivities.map((activity) => (
                                 <SelectItem key={activity.id} value={activity.id}>
                                    {activity.title}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="text-xs"
                           onClick={() => setActivityMode("none")}
                        >
                           Quitar vinculacion
                        </Button>
                     </div>
                  ) : null}
               </section>

               <section className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                     <p className="text-sm font-medium">Planificar por bloques</p>
                     <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                           type="checkbox"
                           checked={planByBlocks}
                           onChange={(event) => {
                              const checked = event.target.checked;
                              setPlanByBlocks(checked);
                              if (checked && blocks.length < 2) {
                                 setBlocks((prev) => [
                                    prev[0] ?? createEmptyBlockDraft(1),
                                    createEmptyBlockDraft(2),
                                 ]);
                              }
                           }}
                        />
                        Dividir clase por bloques
                     </label>
                  </div>

                  {planByBlocks ? (
                     <div className="space-y-2 rounded-md border border-border/70 p-3">
                        {blocks.map((block, index) => (
                           <div key={block.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                              <div className="space-y-1.5">
                                 <Label className="text-xs">Bloque {index + 1} - Tema</Label>
                                 <Input
                                    list={topicSuggestionsListId}
                                    value={block.topic}
                                    onChange={(event) =>
                                       updateBlock(block.id, { topic: event.target.value })
                                    }
                                    className="h-9 text-xs"
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <Label className="text-xs">Actividad</Label>
                                 <Input
                                    value={block.activity}
                                    onChange={(event) =>
                                       updateBlock(block.id, { activity: event.target.value })
                                    }
                                    placeholder="Opcional"
                                    className="h-9 text-xs"
                                 />
                              </div>
                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 className="h-9 w-9"
                                 disabled={blocks.length <= 1}
                                 onClick={() => removeBlock(block.id)}
                              >
                                 <Trash2 className="size-4" />
                              </Button>
                           </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={addBlock}>
                           <Plus className="mr-1.5 size-3.5" /> Agregar bloque
                        </Button>
                     </div>
                  ) : null}
               </section>

               {!isScheduledSlotLocked ? (
                  <section className="grid grid-cols-1 gap-2 rounded-md border border-border/60 bg-muted/20 p-3 sm:grid-cols-3">
                     <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Materia</Label>
                        <Select value={assignmentId} onValueChange={handleAssignmentChange}>
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Seleccionar" />
                           </SelectTrigger>
                           <SelectContent>
                              {availableAssignments.map((assignment) => {
                                 const subjectName = getSubjectById(assignment.subjectId)?.name;
                                 if (!subjectName) {
                                    return null;
                                 }
                                 return (
                                    <SelectItem key={assignment.id} value={assignment.id}>
                                       {subjectName} ({assignment.section})
                                    </SelectItem>
                                 );
                              })}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Fecha</Label>
                        <Input
                           type="date"
                           value={date}
                           onChange={(event) => setDate(event.target.value)}
                           className="h-9 text-xs"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Hora</Label>
                        <Input
                           type="time"
                           value={time}
                           onChange={(event) => setTime(event.target.value)}
                           className="h-9 text-xs"
                        />
                     </div>
                  </section>
               ) : null}
            </div>

            <DialogFooter className="gap-2">
               <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={submit}>
                  Guardar planificacion
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}


