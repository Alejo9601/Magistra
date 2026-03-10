import { useMemo, useState } from "react";
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
import { institutions, subjects, type ClassSession } from "@/lib/edu-repository";
import { classTypeLabels } from "@/components/planificacion/constants";
import type { ClassFormInput } from "@/components/planificacion/types";
import { toast } from "sonner";

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
   const today = new Date();
   const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
   const [institutionId, setInstitutionId] = useState(activeInstitution);
   const [subjectId, setSubjectId] = useState("");
   const [date, setDate] = useState("");
   const [time, setTime] = useState("08:00");
   const [topic, setTopic] = useState("");
   const [type, setType] = useState<ClassSession["type"]>("teorica");
   const [subtopicsText, setSubtopicsText] = useState("");
   const [activities, setActivities] = useState("");
   const [notes, setNotes] = useState("");
   const [resourcesText, setResourcesText] = useState("");

   const availableSubjects = useMemo(
      () => subjects.filter((subject) => subject.institutionId === institutionId),
      [institutionId],
   );

   const reset = () => {
      const nextInstitution = initialClass?.institutionId ?? activeInstitution;
      setInstitutionId(nextInstitution);
      setSubjectId(initialClass?.subjectId ?? "");
      setDate(initialClass?.date ?? initialDate ?? "");
      setTime(initialClass?.time ?? "08:00");
      setTopic(initialClass?.topic ?? "");
      setType(initialClass?.type ?? "teorica");
      setSubtopicsText(initialClass?.subtopics.join("\n") ?? "");
      setActivities(initialClass?.activities ?? "");
      setNotes(initialClass?.notes ?? "");
      setResourcesText(initialClass?.resources?.join(", ") ?? "");
   };

   const submit = (mode: "draft" | "publish") => {
      if (!institutionId || !subjectId || !date || !time || !topic.trim()) {
         toast.error("Completa institucion, materia, fecha, hora y tema principal.");
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

      onSubmit(
         {
            institutionId,
            subjectId,
            date,
            time,
            topic: topic.trim(),
            subtopics: subtopicsText
               .split("\n")
               .map((value) => value.trim())
               .filter(Boolean),
            type,
            status: mode === "publish" ? "planificada" : "sin-planificar",
            activities: activities.trim() || undefined,
            notes: notes.trim() || undefined,
            resources: resources.length > 0 ? resources : undefined,
         },
         mode,
      );
      onOpenChange(false);
   };

   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (isOpen) reset();
         }}
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
                     onValueChange={(value) => {
                        setInstitutionId(value);
                        const firstSubject = subjects.find(
                           (subject) => subject.institutionId === value,
                        );
                        setSubjectId(firstSubject?.id ?? "");
                     }}
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
                  <Select value={subjectId} onValueChange={setSubjectId}>
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                     </SelectTrigger>
                     <SelectContent>
                        {availableSubjects.map((subject) => (
                           <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.course})
                           </SelectItem>
                        ))}
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
                     onChange={(event) => setDate(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Hora</Label>
                  <Input
                     type="time"
                     className="h-9 text-xs"
                     value={time}
                     onChange={(event) => setTime(event.target.value)}
                  />
               </div>
            </div>

            <div className="flex flex-col gap-4 pb-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Tema principal</Label>
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
                  <Label className="text-xs">Tipo de clase</Label>
                  <Select
                     value={type}
                     onValueChange={(value) =>
                        setType(value as ClassSession["type"])
                     }
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar tipo..." />
                     </SelectTrigger>
                     <SelectContent>
                        {Object.entries(classTypeLabels).map(([value, label]) => (
                           <SelectItem key={value} value={value}>
                              {label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Actividades</Label>
                  <Textarea
                     className="text-xs min-h-[85px] resize-none"
                     value={activities}
                     onChange={(event) => setActivities(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Recursos (coma separada)</Label>
                  <Input
                     className="h-9 text-xs"
                     value={resourcesText}
                     onChange={(event) => setResourcesText(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Observaciones internas</Label>
                  <Textarea
                     className="text-xs min-h-[70px] resize-none"
                     value={notes}
                     onChange={(event) => setNotes(event.target.value)}
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
