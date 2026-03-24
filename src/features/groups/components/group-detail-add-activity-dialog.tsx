import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActivityType } from "@/types";

type RubricOption = {
   id: string;
   name: string;
};

type RubricDraftCriterion = {
   id: string;
   name: string;
   weight: string;
};

type CreateRubricPayload = {
   name: string;
   criteria: Array<{ name: string; weight: number }>;
};

type GroupDetailAddActivityDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   subjectName: string;
   section: string;
   title: string;
   type: ActivityType;
   esEvaluable: boolean;
   rubricaId: string;
   rubricOptions: RubricOption[];
   fechaInicio: string;
   fechaFin: string;
   description: string;
   onTitleChange: (value: string) => void;
   onTypeChange: (value: ActivityType) => void;
   onEsEvaluableChange: (value: boolean) => void;
   onRubricaIdChange: (value: string) => void;
   onCreateRubric: (payload: CreateRubricPayload) => void;
   onFechaInicioChange: (value: string) => void;
   onFechaFinChange: (value: string) => void;
   onDescriptionChange: (value: string) => void;
   onSubmit: () => void;
};

function createCriterionDraft(name: string, weight: string): RubricDraftCriterion {
   return {
      id: `draft-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name,
      weight,
   };
}

function createDefaultCriteriaDraft() {
   return [
      createCriterionDraft("Comprension", "50"),
      createCriterionDraft("Aplicacion", "50"),
   ];
}

export function GroupDetailAddActivityDialog({
   open,
   onOpenChange,
   subjectName,
   section,
   title,
   type,
   esEvaluable,
   rubricaId,
   rubricOptions,
   fechaInicio,
   fechaFin,
   description,
   onTitleChange,
   onTypeChange,
   onEsEvaluableChange,
   onRubricaIdChange,
   onCreateRubric,
   onFechaInicioChange,
   onFechaFinChange,
   onDescriptionChange,
   onSubmit,
}: GroupDetailAddActivityDialogProps) {
   const [showRubricComposer, setShowRubricComposer] = useState(false);
   const [showEndDate, setShowEndDate] = useState(false);
   const [rubricNameDraft, setRubricNameDraft] = useState("");
   const [criteriaDraft, setCriteriaDraft] = useState<RubricDraftCriterion[]>(
      createDefaultCriteriaDraft(),
   );

   const canCreateRubric = useMemo(() => {
      if (!rubricNameDraft.trim()) {
         return false;
      }
      const validCriteriaCount = criteriaDraft.filter((criterion) => {
         const criterionName = criterion.name.trim();
         const criterionWeight = Number(criterion.weight);
         return criterionName.length > 0 && Number.isFinite(criterionWeight) && criterionWeight > 0;
      }).length;
      return validCriteriaCount > 0;
   }, [criteriaDraft, rubricNameDraft]);

   const resetRubricComposer = () => {
      setShowRubricComposer(false);
      setRubricNameDraft("");
      setCriteriaDraft(createDefaultCriteriaDraft());
   };

   useEffect(() => {
      if (!esEvaluable) {
         onRubricaIdChange("");
         resetRubricComposer();
      }
   }, [esEvaluable, onRubricaIdChange]);

   useEffect(() => {
      setShowEndDate(Boolean(fechaFin));
   }, [fechaFin, open]);

   return (
      <Dialog
         open={open}
         onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            if (!nextOpen) {
               resetRubricComposer();
               setShowEndDate(Boolean(fechaFin));
            }
         }}
      >
         <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
               <DialogTitle>Nueva actividad</DialogTitle>
               <DialogDescription>
                  {subjectName} - {section}
               </DialogDescription>
            </DialogHeader>

            <form
               className="grid grid-cols-1 gap-4 py-2"
               onSubmit={(event) => {
                  event.preventDefault();
                  if (!title.trim()) {
                     return;
                  }
                  onSubmit();
               }}
            >
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Nombre de la actividad</Label>
                  <Input
                     autoFocus
                     className="h-9 text-xs"
                     placeholder="Ej: Guia de ejercicios de funciones"
                     value={title}
                     onChange={(event) => onTitleChange(event.target.value)}
                  />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Tipo</Label>
                     <Select value={type} onValueChange={(value) => onTypeChange(value as ActivityType)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="practica">Practica</SelectItem>
                           <SelectItem value="examen">Examen</SelectItem>
                           <SelectItem value="proyecto">Proyecto</SelectItem>
                           <SelectItem value="tarea">Tarea</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Evaluacion</Label>
                     <div className="grid grid-cols-2 rounded-md border border-border p-1">
                        <Button
                           type="button"
                           variant={esEvaluable ? "ghost" : "secondary"}
                           size="sm"
                           className="h-8 text-xs"
                           onClick={() => onEsEvaluableChange(false)}
                        >
                           No evaluable
                        </Button>
                        <Button
                           type="button"
                           variant={esEvaluable ? "secondary" : "ghost"}
                           size="sm"
                           className="h-8 text-xs"
                           onClick={() => onEsEvaluableChange(true)}
                        >
                           Evaluable
                        </Button>
                     </div>
                  </div>
               </div>

               {esEvaluable ? (
                  <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                     {!showRubricComposer ? (
                        <div className="flex flex-col gap-1.5">
                           <Label className="text-xs">Rubrica</Label>
                           <Select
                              value={rubricaId || "__none__"}
                              onValueChange={(value) => {
                                 if (value === "__create__") {
                                    setShowRubricComposer(true);
                                    onRubricaIdChange("");
                                    return;
                                 }
                                 onRubricaIdChange(value === "__none__" ? "" : value);
                              }}
                           >
                              <SelectTrigger className="h-9 text-xs">
                                 <SelectValue placeholder="Seleccionar rubrica" />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="__none__">Sin rubrica</SelectItem>
                                 {rubricOptions.map((rubric) => (
                                    <SelectItem key={rubric.id} value={rubric.id}>
                                       {rubric.name}
                                    </SelectItem>
                                 ))}
                                 <div className="my-1 border-t border-border/60" />
                                 <SelectItem value="__create__">+ Crear nueva rubrica</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Nombre de la rubrica</Label>
                              <Input
                                 className="h-9 text-xs"
                                 placeholder="Ej: Rubrica - Exposicion oral"
                                 value={rubricNameDraft}
                                 onChange={(event) => setRubricNameDraft(event.target.value)}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label className="text-xs">Criterios</Label>
                              {criteriaDraft.map((criterion) => (
                                 <div key={criterion.id} className="grid grid-cols-[1fr_84px_auto] gap-2 items-end">
                                    <Input
                                       className="h-9 text-xs"
                                       placeholder="Criterio"
                                       value={criterion.name}
                                       onChange={(event) =>
                                          setCriteriaDraft((prev) =>
                                             prev.map((item) =>
                                                item.id === criterion.id
                                                   ? { ...item, name: event.target.value }
                                                   : item,
                                             ),
                                          )
                                       }
                                    />
                                    <Input
                                       type="number"
                                       className="h-9 text-xs"
                                       min={1}
                                       step={1}
                                       placeholder="Peso"
                                       value={criterion.weight}
                                       onChange={(event) =>
                                          setCriteriaDraft((prev) =>
                                             prev.map((item) =>
                                                item.id === criterion.id
                                                   ? { ...item, weight: event.target.value }
                                                   : item,
                                             ),
                                          )
                                       }
                                    />
                                    <Button
                                       type="button"
                                       variant="ghost"
                                       size="sm"
                                       className="h-9 px-2 text-xs"
                                       onClick={() =>
                                          setCriteriaDraft((prev) =>
                                             prev.length <= 1
                                                ? prev
                                                : prev.filter((item) => item.id !== criterion.id),
                                          )
                                       }
                                       disabled={criteriaDraft.length <= 1}
                                    >
                                       Quitar
                                    </Button>
                                 </div>
                              ))}

                              <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 className="text-xs"
                                 onClick={() =>
                                    setCriteriaDraft((prev) => [...prev, createCriterionDraft("", "")])
                                 }
                              >
                                 Agregar criterio
                              </Button>
                           </div>

                           <div className="flex items-center justify-end gap-2">
                              <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 className="text-xs"
                                 onClick={resetRubricComposer}
                              >
                                 Cancelar
                              </Button>
                              <Button
                                 type="button"
                                 size="sm"
                                 className="text-xs"
                                 disabled={!canCreateRubric}
                                 onClick={() => {
                                    const payload = {
                                       name: rubricNameDraft.trim(),
                                       criteria: criteriaDraft
                                          .map((criterion) => ({
                                             name: criterion.name.trim(),
                                             weight: Number(criterion.weight),
                                          }))
                                          .filter(
                                             (criterion) =>
                                                criterion.name.length > 0 &&
                                                Number.isFinite(criterion.weight) &&
                                                criterion.weight > 0,
                                          ),
                                    };
                                    onCreateRubric(payload);
                                    resetRubricComposer();
                                 }}
                              >
                                 Guardar rubrica y seleccionar
                              </Button>
                           </div>
                        </div>
                     )}
                  </div>
               ) : null}

               <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Fecha</Label>
                     <Input
                        className="h-9 text-xs"
                        type="date"
                        value={fechaInicio}
                        onChange={(event) => onFechaInicioChange(event.target.value)}
                     />
                  </div>

                  {!showEndDate ? (
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground"
                        onClick={() => setShowEndDate(true)}
                     >
                        + Agregar fecha fin
                     </Button>
                  ) : (
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Fecha fin</Label>
                        <Input
                           className="h-9 text-xs"
                           type="date"
                           value={fechaFin}
                           onChange={(event) => onFechaFinChange(event.target.value)}
                        />
                     </div>
                  )}
               </div>

               <div className="flex flex-col gap-1.5 opacity-90">
                  <Label className="text-xs">Consigna / Observaciones (opcional)</Label>
                  <Textarea
                     className="text-xs min-h-[72px] resize-none"
                     placeholder="Indicaciones para la actividad..."
                     value={description}
                     onChange={(event) => onDescriptionChange(event.target.value)}
                  />
               </div>

               <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs" type="button">
                     Cancelar
                  </Button>
                  <Button size="sm" className="text-xs" type="submit" disabled={!title.trim()}>
                     Guardar
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

