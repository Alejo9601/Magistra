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
import type { ClassSession } from "@/types";

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

   const reset = () => {
      const nextInstitution = activeInstitution;
      const candidateAssignmentId =
         initialClass?.assignmentId ??
         (initialClass?.subjectId
            ? getAssignmentIdBySubjectId(initialClass.subjectId)
            : "");
      setAssignmentId(
         resolveAssignmentIdForInstitution({
            institutionId: nextInstitution,
            candidateAssignmentId,
            assignmentsByInstitution: getAssignmentsByInstitution(nextInstitution),
            getAssignmentById,
         }),
      );
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
      if (!assignmentId || !date || !time || !topic.trim()) {
         toast.error("Completa institucion, materia, fecha, hora y tema principal.");
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

      onSubmit(
         {
            institutionId: assignment.institutionId,
            subjectId: assignment.subjectId,
            assignmentId: assignment.id,
            date,
            time,
            topic: topic.trim(),
            subtopics: subtopicsText
               .split("\n")
               .map((value) => value.trim())
               .filter(Boolean),
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
               <DialogDescription>Completa los datos para planificar una clase.</DialogDescription>
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
                  <Select value={assignmentId} onValueChange={setAssignmentId}>
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
