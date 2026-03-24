import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActivityStatus, ActivityType } from "@/types";

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
   status: ActivityStatus;
   esEvaluable: boolean;
   rubricaId: string;
   rubricOptions: RubricOption[];
   fechaInicio: string;
   fechaFin: string;
   description: string;
   onTitleChange: (value: string) => void;
   onTypeChange: (value: ActivityType) => void;
   onStatusChange: (value: ActivityStatus) => void;
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
   status,
   esEvaluable,
   rubricaId,
   rubricOptions,
   fechaInicio,
   fechaFin,
   description,
   onTitleChange,
   onTypeChange,
   onStatusChange,
   onEsEvaluableChange,
   onRubricaIdChange,
   onCreateRubric,
   onFechaInicioChange,
   onFechaFinChange,
   onDescriptionChange,
   onSubmit,
}: GroupDetailAddActivityDialogProps) {
   const [showRubricComposer, setShowRubricComposer] = useState(false);
   const [rubricNameDraft, setRubricNameDraft] = useState("");
   const [criteriaDraft, setCriteriaDraft] = useState<RubricDraftCriterion[]>(
      createDefaultCriteriaDraft(),
   );

   useEffect(() => {
      if (!esEvaluable) {
         onRubricaIdChange("");
         resetRubricComposer();
      }
   }, [esEvaluable, onRubricaIdChange]);

   const canCreateRubric = useMemo(() => {
      const normalizedName = rubricNameDraft.trim();
      if (!normalizedName) {
         return false;
      }
      const validCriteriaCount = criteriaDraft.filter((criterion) => {
         const name = criterion.name.trim();
         const weight = Number(criterion.weight);
         return name.length > 0 && Number.isFinite(weight) && weight > 0;
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

   return (
      <Dialog
         open={open}
         onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            if (!nextOpen) {
               resetRubricComposer();
            }
         }}
      >
         <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
               <DialogTitle>Nueva actividad</DialogTitle>
               <DialogDescription>
                  Crea una actividad para {subjectName} - {section}.
               </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Nombre de la actividad</Label>
                  <Input
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
                     <Label className="text-xs">Estado</Label>
                     <Select value={status} onValueChange={(value) => onStatusChange(value as ActivityStatus)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="draft">Borrador</SelectItem>
                           <SelectItem value="planned">Planificada</SelectItem>
                           <SelectItem value="assigned">Asignada</SelectItem>
                           <SelectItem value="completed">Completada</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <label className="flex items-center gap-2 text-xs text-foreground">
                  <Checkbox
                     checked={esEvaluable}
                     onCheckedChange={(checked) => onEsEvaluableChange(Boolean(checked))}
                  />
                  Es evaluable
               </label>

               {esEvaluable ? (
                  <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                     {!showRubricComposer ? (
                        <div className="flex flex-col gap-1.5">
                           <Label className="text-xs">Rubrica (opcional)</Label>
                           <Select
                              value={rubricaId || "__none__"}
                              onValueChange={(value) => onRubricaIdChange(value === "__none__" ? "" : value)}
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
                              </SelectContent>
                           </Select>
                        </div>
                     ) : null}

                     <div className="space-y-2 pt-1">
                        <p className="text-xs text-muted-foreground">
                           {rubricOptions.length === 0
                              ? "No hay rubricas creadas para esta materia."
                              : "Si no te sirve ninguna, crea una nueva sin salir del formulario."}
                        </p>
                        {!showRubricComposer ? (
                           <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setShowRubricComposer(true)}
                           >
                              Crear rubrica
                           </Button>
                        ) : null}

                        {showRubricComposer ? (
                           <div className="space-y-3 pt-1">
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
                        ) : null}
                     </div>
                  </div>
               ) : null}

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Fecha inicio</Label>
                     <Input className="h-9 text-xs" type="date" value={fechaInicio} onChange={(event) => onFechaInicioChange(event.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Fecha fin</Label>
                     <Input className="h-9 text-xs" type="date" value={fechaFin} onChange={(event) => onFechaFinChange(event.target.value)} />
                  </div>
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Descripcion (opcional)</Label>
                  <Textarea className="text-xs min-h-[80px] resize-none" placeholder="Objetivos, consigna y criterios..." value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={onSubmit}>
                  Guardar
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}







