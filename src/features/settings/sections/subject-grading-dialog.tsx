import { useEffect, useMemo, useState } from "react";
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
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   createDefaultRubricCriterion,
   createDefaultSubjectGradingScheme,
   createDefaultSubjectRubric,
   normalizeSubjectGradingScheme,
} from "@/lib/grading-schemes";
import type { Subject, SubjectGradingScheme, SubjectRubric } from "@/types";

type SubjectGradingDialogProps = {
   open: boolean;
   subject: Subject | null;
   onOpenChange: (open: boolean) => void;
   onSave: (subjectId: string, gradingScheme: SubjectGradingScheme) => void;
};

function normalizeRubric(rubric: SubjectRubric): SubjectRubric {
   const criteriaTotal = rubric.criteria.reduce((acc, item) => acc + item.weight, 0);
   const normalizedCriteria =
      criteriaTotal > 0
         ? rubric.criteria
         : [createDefaultRubricCriterion({ name: "Criterio", weight: 100 })];

   return {
      ...rubric,
      name: rubric.name.trim() || "Rúbrica",
      criteria: normalizedCriteria.map((criterion) => ({
         ...criterion,
         name: criterion.name.trim() || "Criterio",
         weight: Math.max(1, Math.round(criterion.weight || 0)),
      })),
   };
}

export function SubjectGradingDialog({
   open,
   subject,
   onOpenChange,
   onSave,
}: SubjectGradingDialogProps) {
   const [draft, setDraft] = useState<SubjectGradingScheme>(
      createDefaultSubjectGradingScheme(),
   );

   useEffect(() => {
      if (!open) {
         return;
      }
      setDraft(normalizeSubjectGradingScheme(subject?.gradingScheme));
   }, [open, subject]);

   const totalWeight = useMemo(
      () =>
         draft.weights.exams +
         draft.weights.practice +
         draft.weights.activities +
         draft.weights.participation,
      [draft.weights],
   );

   const updateRubric = (rubricId: string, patch: Partial<SubjectRubric>) => {
      setDraft((prev) => ({
         ...prev,
         rubrics: prev.rubrics.map((rubric) =>
            rubric.id === rubricId ? normalizeRubric({ ...rubric, ...patch }) : rubric,
         ),
      }));
   };

   const handleSave = () => {
      if (!subject) {
         return;
      }
      if (totalWeight !== 100) {
         return;
      }
      const normalized = normalizeSubjectGradingScheme({
         ...draft,
         rubrics: draft.rubrics.map((rubric) => normalizeRubric(rubric)),
      });
      onSave(subject.id, normalized);
      onOpenChange(false);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Calificación por materia</DialogTitle>
               <DialogDescription>
                  Configura escala, ponderaciones y rúbricas para {subject?.name ?? "la materia"}.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
               <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                     <Label className="text-xs">Escala</Label>
                     <Select
                        value={draft.scale}
                        onValueChange={(value) =>
                           setDraft((prev) => ({
                              ...prev,
                              scale: value as SubjectGradingScheme["scale"],
                              passingScore: value === "numeric-100" ? 60 : 6,
                           }))
                        }
                     >
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="numeric-10">Numérica 1-10</SelectItem>
                           <SelectItem value="numeric-100">Numérica 0-100</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-1.5">
                     <Label className="text-xs">Nota mínima</Label>
                     <Input
                        className="h-9 text-xs"
                        type="number"
                        min={1}
                        max={draft.scale === "numeric-100" ? 100 : 10}
                        step={draft.scale === "numeric-100" ? 1 : 0.1}
                        value={draft.passingScore}
                        onChange={(event) =>
                           setDraft((prev) => ({
                              ...prev,
                              passingScore: Number(event.target.value || 0),
                           }))
                        }
                     />
                  </div>

                  <div className="space-y-1.5">
                     <Label className="text-xs">Redondeo</Label>
                     <Select
                        value={draft.rounding}
                        onValueChange={(value) =>
                           setDraft((prev) => ({
                              ...prev,
                              rounding: value as SubjectGradingScheme["rounding"],
                           }))
                        }
                     >
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="nearest">Al más cercano</SelectItem>
                           <SelectItem value="up">Siempre hacia arriba</SelectItem>
                           <SelectItem value="none">Sin redondeo</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-semibold">Ponderaciones (%)</p>
                     <span
                        className={`text-xs ${
                           totalWeight === 100 ? "text-success" : "text-warning-foreground"
                        }`}
                     >
                        Total: {totalWeight}%
                     </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     <div className="space-y-1">
                        <Label className="text-[11px]">Exámenes</Label>
                        <Input
                           className="h-8 text-xs"
                           type="number"
                           min={0}
                           value={draft.weights.exams}
                           onChange={(event) =>
                              setDraft((prev) => ({
                                 ...prev,
                                 weights: {
                                    ...prev.weights,
                                    exams: Number(event.target.value || 0),
                                 },
                              }))
                           }
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[11px]">Prácticos</Label>
                        <Input
                           className="h-8 text-xs"
                           type="number"
                           min={0}
                           value={draft.weights.practice}
                           onChange={(event) =>
                              setDraft((prev) => ({
                                 ...prev,
                                 weights: {
                                    ...prev.weights,
                                    practice: Number(event.target.value || 0),
                                 },
                              }))
                           }
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[11px]">Actividades</Label>
                        <Input
                           className="h-8 text-xs"
                           type="number"
                           min={0}
                           value={draft.weights.activities}
                           onChange={(event) =>
                              setDraft((prev) => ({
                                 ...prev,
                                 weights: {
                                    ...prev.weights,
                                    activities: Number(event.target.value || 0),
                                 },
                              }))
                           }
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[11px]">Participación</Label>
                        <Input
                           className="h-8 text-xs"
                           type="number"
                           min={0}
                           value={draft.weights.participation}
                           onChange={(event) =>
                              setDraft((prev) => ({
                                 ...prev,
                                 weights: {
                                    ...prev.weights,
                                    participation: Number(event.target.value || 0),
                                 },
                              }))
                           }
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-semibold">Rúbricas</p>
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() =>
                           setDraft((prev) => ({
                              ...prev,
                              rubrics: [
                                 ...prev.rubrics,
                                 createDefaultSubjectRubric({
                                    name: `Rúbrica ${prev.rubrics.length + 1}`,
                                 }),
                              ],
                           }))
                        }
                     >
                        <Plus className="size-3.5 mr-1" />
                        Agregar rúbrica
                     </Button>
                  </div>

                  {draft.rubrics.length === 0 ? (
                     <p className="text-xs text-muted-foreground">
                        No hay rúbricas configuradas. Puedes seguir cargando notas manuales o crear una rúbrica.
                     </p>
                  ) : (
                     <div className="space-y-3">
                        {draft.rubrics.map((rubric) => (
                           <div key={rubric.id} className="rounded-md border p-3 space-y-3">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                 <div className="sm:col-span-11 space-y-1">
                                    <Label className="text-[11px]">Nombre</Label>
                                    <Input
                                       className="h-8 text-xs"
                                       value={rubric.name}
                                       onChange={(event) =>
                                          updateRubric(rubric.id, { name: event.target.value })
                                       }
                                    />
                                 </div>
                                 <div className="sm:col-span-1 flex items-end justify-end">
                                    <Button
                                       type="button"
                                       variant="ghost"
                                       size="icon"
                                       className="size-8"
                                       onClick={() =>
                                          setDraft((prev) => ({
                                             ...prev,
                                             rubrics: prev.rubrics.filter((item) => item.id !== rubric.id),
                                          }))
                                       }
                                       title="Eliminar rúbrica"
                                    >
                                       <Trash2 className="size-3.5 text-destructive" />
                                    </Button>
                                 </div>
                              </div>

                              <div className="space-y-2">
                                 <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-medium">Criterios</p>
                                    <Button
                                       type="button"
                                       variant="outline"
                                       size="sm"
                                       className="h-7 text-[11px]"
                                       onClick={() =>
                                          updateRubric(rubric.id, {
                                             criteria: [
                                                ...rubric.criteria,
                                                createDefaultRubricCriterion({
                                                   name: `Criterio ${rubric.criteria.length + 1}`,
                                                   weight: 20,
                                                }),
                                             ],
                                          })
                                       }
                                    >
                                       <Plus className="size-3 mr-1" />
                                       Agregar criterio
                                    </Button>
                                 </div>

                                 <div className="space-y-1.5">
                                    {rubric.criteria.map((criterion) => (
                                       <div key={criterion.id} className="grid grid-cols-12 gap-2 items-center">
                                          <Input
                                             className="col-span-8 h-8 text-xs"
                                             value={criterion.name}
                                             onChange={(event) =>
                                                updateRubric(rubric.id, {
                                                   criteria: rubric.criteria.map((item) =>
                                                      item.id === criterion.id
                                                         ? { ...item, name: event.target.value }
                                                         : item,
                                                   ),
                                                })
                                             }
                                          />
                                          <Input
                                             className="col-span-3 h-8 text-xs"
                                             type="number"
                                             min={1}
                                             value={criterion.weight}
                                             onChange={(event) =>
                                                updateRubric(rubric.id, {
                                                   criteria: rubric.criteria.map((item) =>
                                                      item.id === criterion.id
                                                         ? {
                                                              ...item,
                                                              weight: Number(event.target.value || 0),
                                                           }
                                                         : item,
                                                   ),
                                                })
                                             }
                                          />
                                          <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             className="col-span-1 size-8"
                                             onClick={() =>
                                                updateRubric(rubric.id, {
                                                   criteria: rubric.criteria.filter((item) => item.id !== criterion.id),
                                                })
                                             }
                                             disabled={rubric.criteria.length <= 1}
                                          >
                                             <Trash2 className="size-3.5 text-muted-foreground" />
                                          </Button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <DialogFooter>
               <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onOpenChange(false)}
               >
                  Cancelar
               </Button>
               <Button
                  size="sm"
                  className="text-xs"
                  onClick={handleSave}
                  disabled={!subject || totalWeight !== 100}
               >
                  Guardar configuración
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
