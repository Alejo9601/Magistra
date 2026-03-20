import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubjectRubric } from "@/types";

type SubjectRubricsEditorProps = {
   rubrics: SubjectRubric[];
   onAddRubric: () => void;
   onRemoveRubric: (rubricId: string) => void;
   onRubricNameChange: (rubricId: string, name: string) => void;
   onAddCriterion: (rubric: SubjectRubric) => void;
   onCriterionNameChange: (rubric: SubjectRubric, criterionId: string, name: string) => void;
   onCriterionWeightChange: (rubric: SubjectRubric, criterionId: string, weight: string) => void;
   onRemoveCriterion: (rubric: SubjectRubric, criterionId: string) => void;
};

export function SubjectRubricsEditor({
   rubrics,
   onAddRubric,
   onRemoveRubric,
   onRubricNameChange,
   onAddCriterion,
   onCriterionNameChange,
   onCriterionWeightChange,
   onRemoveCriterion,
}: SubjectRubricsEditorProps) {
   return (
      <div className="space-y-3">
         <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Rúbricas</p>
            <Button
               type="button"
               variant="outline"
               size="sm"
               className="h-8 text-xs"
               onClick={onAddRubric}
            >
               <Plus className="size-3.5 mr-1" />
               Agregar rúbrica
            </Button>
         </div>

         {rubrics.length === 0 ? (
            <p className="text-xs text-muted-foreground">
               No hay rúbricas configuradas. Puedes seguir cargando notas manuales o crear una rúbrica.
            </p>
         ) : (
            <div className="space-y-3">
               {rubrics.map((rubric) => (
                  <div key={rubric.id} className="rounded-md border p-3 space-y-3">
                     <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-11 space-y-1">
                           <Label className="text-[11px]">Nombre</Label>
                           <Input
                              className="h-8 text-xs"
                              value={rubric.name}
                              onChange={(event) => onRubricNameChange(rubric.id, event.target.value)}
                           />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-end">
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => onRemoveRubric(rubric.id)}
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
                              onClick={() => onAddCriterion(rubric)}
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
                                       onCriterionNameChange(rubric, criterion.id, event.target.value)
                                    }
                                 />
                                 <Input
                                    className="col-span-3 h-8 text-xs"
                                    type="number"
                                    min={1}
                                    value={criterion.weight}
                                    onChange={(event) =>
                                       onCriterionWeightChange(rubric, criterion.id, event.target.value)
                                    }
                                 />
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="col-span-1 size-8"
                                    onClick={() => onRemoveCriterion(rubric, criterion.id)}
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
   );
}
